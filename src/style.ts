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

import assign = require('./assign');

// see http://facebook.github.io/react/tips/style-props-value-px.html
var NON_PX_PROPERTIES = [
  'columnCount',
  'fillOpacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'widows',
  'zIndex',
  'zoom'
];

export interface Style {
	/** A key for the style, used to generate CSS class names. */
	key?: string;
	/** The parent style, used to generate CSS class names for
	  * nested styles.
	  */
	parent?: Style;
	/** Mixins used by this style */
	mixins?: Style[];

	/** CSS property or nested style */
	[index: string]: string | number | Style | Style[];
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

function isSpecialProp(key: string) {
	return key === 'key' || key === 'parent' || key === 'mixins';
}

function addKeys(tree: any, prefix: string) {
	Object.keys(tree).forEach((k) => {
		var prop = tree[k];
		if (typeof prop === 'object' &&
		    prop !== tree &&
			prop.key === undefined &&
			prop.parent === undefined) {
			addKeys(prop, prefix);

			prop.key = prefix + hyphenate(k);
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
  *   }, 'my-app');
  *   style.compile(styles);
  *
  * Generates:
  *
  *  .my-app-class-a {
  *    background-color: 'white';
  *    width: 100px;
  *  }
  *
  * All styles defined via create() are added to the global
  * registry, which allows generation of the CSS for all
  * styles defined by modules loaded via a particular entry
  * point.
  *
  * @param namespace An optional namespace which is
  *                  added as a prefix in front of all generated
  *                  class names. If the namespace is a filename or path
  *                  then the basename will be extracted and hyphenated,
  *                  eg. '/myapp/myComponent.js' -> 'my-component'.
  *
  *                  A convention is to pass __filename as the namespace
  *                  argument, to make it easy to find where a generated
  *                  class was defined.
  */
export function create<T>(tree: T, namespace?: string) : T {
	if (typeof namespace === 'string') {
		// if the namespace if a filename or path, extract the basename
		// and hyphenate it
		if (namespace.indexOf('.') !== -1 || namespace.indexOf('/') !== -1) {
			var basenameRegEx = /([^/\.]+)\.[^\.]+$/;
			var basenameMatch = namespace.match(basenameRegEx);
			if (basenameMatch) {
				var basename = basenameMatch[1];
				namespace = hyphenate(basename.replace('_', '-'));
			}
		}
	} else {
		namespace = '';
	}

	if (namespace.length > 0 && namespace[namespace.length-1] !== '-') {
		namespace += '-';
	}

	addKeys(tree, namespace);

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
		var compiled = <Style><any>object;
		if (classNames.length > 0) {
			classNames += ' ';
		}
		classNames += className(compiled);
	});
	return classNames;
}

function hyphenate(name: string) {
	// adapted from React's hyphenate.js
	var uppercasePattern = /([A-Z])/g;
	return name.replace(uppercasePattern, '-$1').toLowerCase();
}

function cssPropValue(propName: string, value: any) {
	if (typeof value == 'number' && NON_PX_PROPERTIES.indexOf(propName) === -1) {
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
		if (isSpecialProp(k)) {
			return;
		}

		var prop = (<any>tree)[k];
		if (typeof prop == 'object') {
			classes.push(compile(prop));
		} else {
			cssProps.push(hyphenate(k) + ': ' + cssPropValue(k, prop));
		}
	});

	var style: Style = <any>tree;
	var css = '';
	if (style.key && cssProps.length > 0) {
		css = cssClass(className(style), cssProps);
	}
	return [css].concat(classes).join('\n\n');
}

interface StyleProps {
	// space-separated list of CSS class names
	className?: string;

	// map of camelCased style property -> number | string
	style?: {[index:string] : any /* number | string */};
}

/** Returns true if @p obj is a style tree returned by style.create()
  * or an element of one.
  */
export function isStyle(obj: Object) {
	return 'key' in obj;
}

function flattenMixins(styles: Object | Object[]): Object | Object[] {
	if (styles instanceof Array) {
		var styleList: any[] = [];
		styles.forEach((style: Style) => {
			if (!style) {
				return;
			}
			if (style.mixins) {
				style.mixins.forEach((style) => {
					styleList.push(style);
				});
			}
			styleList.push(style);
		});
		return styleList;
	} else if (styles instanceof Object) {
		var style = <Style>styles;
		if (style.mixins) {
			return flattenMixins([styles]);
		} else {
			return styles;
		}
	} else {
		return null;
	}
}

function combine(styles: Style[]) : StyleProps {
	var inlineStyles: {[index:string] : string | number};

	// where CSS classes have conflicting properties,
	// use inline styles
	var usedProps: {[index:string] : boolean} = {};
	styles.forEach((style) => {
		if (!style) {
			return;
		}

		var isInline = !('key' in style);
		for (var prop in style) {
			// ignore properties added by style.create()
			// and nested styles
			if (isSpecialProp(prop)) {
				continue;
			}

			var value = style[prop];
			if (typeof value === 'number' || typeof value === 'string') {
				if (usedProps[prop] || isInline) {
					inlineStyles = inlineStyles || {};
					inlineStyles[prop] = value;
				}
				usedProps[prop] = true;
			}
		}
	});

	return {
		style: inlineStyles,
		className: classes.apply(null, styles)
	};
}

/** mixin() is a utility function for use with React which takes the
  * props object for a component and adds the necessary additional
  * 'className' and/or 'style' props to apply styling from
  * a style returned by create(). 'styles' can be a single
  * style or an array of styles.
  */
export function mixin<P>(styles: Object | Object[], props?: P) : P {
	props = props || <P>{};
	styles = flattenMixins(styles);

	if (styles instanceof Array) {
		var styleProps = combine(styles);
		if (styleProps.className) {
			(<StyleProps>props).className = styleProps.className;
		}
		if (styleProps.style) {
			(<StyleProps>props).style = styleProps.style;
		}
	} else if (styles instanceof Object) {
		var style = <Style>styles;
		if (style.key) {
			(<StyleProps>props).className = classes(style);
		} else {
			(<StyleProps>props).style = style;
		}
	}
	return props;
}

/** Merges a set of inline style objects together into
  * a single style.
  *
  * This can be used to create mixins.
  */
export function merge(...styles: any[]) : Object {
	var merged: Style = {};
	styles.forEach((style) => {
		assign(merged, style);
	});
	delete merged.key;
	delete merged.parent;
	return merged;
}

