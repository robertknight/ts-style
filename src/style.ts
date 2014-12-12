/*
   style.ts provides a minimalistic way to define CSS
   classes using JavaScript structures.

   For the rationale for using JS as a CSS generator, see
   https://speakerdeck.com/vjeux/react-css-in-js .

   In addition to the benefits discussed there,
   defining them in TypeScript allows compile-time
   checking of style references in components.

   Unlike the implementation described in that presentation,
   this implementation does not use inline styles but
   instead generates CSS classes in a very simple way.
   
   The resulting CSS is consequently easy to read/tweak/post-process
   and work with in browser development tools.
*/

export interface Style {
	/** A key for the style, used to generate CSS class names. */
	key?: string;
	/** The parent style, used to generate CSS class names for
	  * nested styles.
	  */
	parent?: Style;
}

/** A style registry holds a collection of named
  * styles created by calls to create()
  */
export interface StyleRegistry {
	styles() : {[name: string] : Style} 
	add(style: Style) : void;
}

class StyleRegistryImpl implements StyleRegistry {
	private styleMap: {[name: string]: Style};

	constructor() {
		this.styleMap = {};
	}

	add(style: Style) {
		this.styleMap[style.key] = style;
	}

	styles() {
		return this.styleMap;
	}
}

/** A global registry of all styles defined via style.create()
  */
export var registry: StyleRegistry = new StyleRegistryImpl();

function addKeys(tree: any) {
	Object.keys(tree).forEach((k) => {
		var prop = tree[k];
		if (typeof prop === 'object' &&
		    prop !== tree &&
			prop.key === undefined &&
			prop.parent === undefined) {
			addKeys(prop);

			prop.key = k;
			prop.parent = tree;
		}
	});
}

/** Given an object tree that defines styles
  * and their properties, returns a tree of Style
  * objects that can later be passed to compile()
  * to generate CSS or className() to get the class
  * names for a style.
  *
  * eg:
  *   var styles = style.create({
  *     classA: {
  *       backgroundColor: 'white',
  *       width: 100
  *     }
  *   });
  *   style.compile(styles);
  *
  * Generates:
  *
  *  .classA {
  *    background-color: 'white';
  *    width: 100px;
  *  }
  *
  * All styles defined via create() are added to the global
  * registry, which allows generation of the CSS for all
  * styles defined by modules loaded via a particular entry
  * point.
  */
export function create<T>(tree: T) : T {
	addKeys(tree);

	Object.keys(tree).forEach((k) => {
		var style = <Style>(<any>tree)[k];
		if (style.key) {
			registry.add(style);
		}
	});

	return tree;
}

function className(style: Style) : string {
	var name = style.key ? style.key : '';
	if (style.parent) {
		var parentClass = className(style.parent);
		if (parentClass) {
			if (name[0].match(/[a-z]/)) {
				name = parentClass + '-' + name;
			} else {
				name = parentClass + name;
			}
		}
	}
	return name;
}

/** Given a list of objects from a style tree generated
  * by style.create(), returns a space-separated list
  * of class-names for those styles in the CSS generated
  * by compile()
  */
export function classes<T>(...objects: T[]) : string {
	var classNames = '';
	objects.forEach((object) => {
		if (!object) {
			return;
		}
		var compiled = <Style>object;
		if (classNames.length > 0) {
			classNames += ' ';
		}
		classNames += className(compiled);
	});
	return classNames;
}

function cssPropName(name: string) {
	// adapted from React's hyphenate.js
	var uppercasePattern = /([A-Z])/g;
	return name.replace(uppercasePattern, '-$1').toLowerCase();
}

function cssPropValue(value: any) {
	if (typeof value == 'number') {
		return value + 'px';
	} else {
		return value.toString();
	}
}

function cssClass(name: string, exprs: string[]) {
	var css = '.' + name + ' {\n';
	exprs.forEach((expr, index) => {
		css += '  ' + expr + ';\n';
	});
	css += '}';
	return css;
}

/** Given a style tree generated by create(),
  * returns the CSS for the classes defined
  * in that tree.
  */
export function compile<T>(tree: T) : string {
	var classes: string[] = [];
	var cssProps: string[] = [];
	Object.keys(tree).forEach((k) => {
		if (k === 'key' || k === 'parent') {
			return;
		}

		var prop = (<any>tree)[k];
		if (typeof prop == 'object') {
			classes.push(compile(prop));
		} else {
			cssProps.push(cssPropName(k) + ': ' + cssPropValue(prop));
		}
	});

	var style: Style = tree;
	var css = '';
	if (style.key && cssProps.length > 0) {
		css = cssClass(className(style), cssProps);
	}
	return [css].concat(classes).join('\n\n');
}

interface StyledElementProps {
	className?: string;
	style?: string;
}

/** mixin() is a utility function for use with React which takes the
  * props object for a component and adds the necessary additional
  * 'className' and/or 'style' props to apply styling from
  * a style returned by create(). 'styles' can be a single
  * style or an array of styles.
  */
export function mixin<P>(styles: any, props?: P) : P {
	props = props || <P>{};
	if (Array.isArray(styles)) {
		(<StyledElementProps>props).className = classes.apply(null, styles);
	} else {
		(<StyledElementProps>props).className = classes(styles);
	}
	return props;
}

