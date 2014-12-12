# ts-style
[![Build Status](https://travis-ci.org/robertknight/ts-style.png?branch=master)](https://travis-ci.org/robertknight/ts-style)

ts-style is a minimalist library for
defining CSS styles using JavaScript or TypeScript,
primarily intended for use with front-end libraries like React where components
are defined in JavaScript. It has no dependencies on a specific
UI library.

For background on why you might want to do such a thing, see
[@vjeux](https://twitter.com/vjeux)'s talk on [CSS in JS](https://speakerdeck.com/vjeux/react-css-in-js),
or [this post on AbsurdJS](http://davidwalsh.name/write-css-javascript).

See also [React Style](https://github.com/js-next/react-style) for a library
specifically for defining styles for React components in JavaScript.

### Rationale

Using JavaScript to generate CSS styles allows re-use
of existing language facilities and tools for defining constants, mixins,
imports that CSS pre-processors like LESS or SASS are
often used for.

Using TypeScript for the code that defines the classes
and the code that references them additionally provides
compile-time checking that style references are valid
and allows use of tooling (eg. Visual Studio) for
navigating the code.

### Goals
 * Enable use of JavaScript/TypeScript language features
   and tooling for defining component styles
 * Generate simple, readable CSS that is easy to work with in browser dev tools.
 * No dependencies on a specific UI library, although ts-style is built
   with React in mind

### Basic Usage
Styles are created by passing an object defining class names
and their properties to `style.create()`. Style property names
are written in camelCase and converted to hyphenated-names
 when the CSS is generated. Numeric values are translated
 to 'px' units.

theme.js:

````
var theme = style.create({
  button: {
    backgroundColor: 'green',
    width: 100,
    borderRadius: 3
  }
});
````
`ts-style theme.js` OR `style.compile(theme)` then generates this CSS:
````
button {
  background-color: green;
  width: 100px;
  border-radius: 3px;
}
````

In the JS logic or templates that define the components
using the styles, rather than using string literals for
class names, use `style.classes()` to get the names
of the generated classes. For example,
in a React component:


````
var Button = React.createClass({
  render: function() {
    return React.DOM.div({className: style.classes(theme.button)},
      this.props.label);
  }
});
````

Or for a more succinct way of applying styling, use `style.mixin()`:

````
var Button = React.createClass({
  render: function() {
    return React.DOM.div(style.mixin(theme.button),
      this.props.label);
  }
});
````

### Namespaces

The tree passed to `style.create()` can contain nested objects and parent
property names are used in the generated class names:

````
var theme = style.create({
  button: {
    backgroundColor: 'red',
    disabled: {
      backgroundColor: 'white'
    }
  }
});
````

Generates:

````
.button {
  background-color: red;
}

.button-disabled {
  background-color: white;
}
````

### Descendant and Pseudo-Selectors

Property names that begin with a lower-case letter become
CSS class selectors. Other property names are simply appended
to the selector for the containing object. This allows
pseudo and descendant selectors to be defined:

````
var theme = style.create({
    widget: {
      ' a' : {
        textDecoration: 'none'
      },
      '::active' : {
        fontWeight: 'bold'
      }
    }
})
````

Generates:

````
.widget a {
  text-decoration: none;
}
.widget::active {
  font-weight: bold;
}
````

### Specificity and Style Resolution

The order of classes in the generated CSS will match the
order of properties passed to `style.create()`.
Hence if multiple styles are applied to a component,
the last one defined takes precedence. ts-style does not
currently attempt to solve this problem.

## API

`create<T>(object: T) : T`

`create()` takes an object tree defining CSS classes and
returns an augmented object with the same structure.
Properties (or nested properties) of the object can
then be passed to `classes()` to get the corresponding
class names.

`classes(...object: Object[]) : string`

`classes()` takes one or more objects from the result
of `create()` and returns a space-separated list of
class names that can be used as the value for the
_class_ property of a DOM element.

`compile(styles: Object) : string`

`compile()` takes an object returned by `create()`
and generates the corresponding CSS classes.

`registry: StyleRegistry`

All of the styles that are created with `create()` are
stored in a registry which is a map of top-level CSS
class names to the object returned by `create()`.

`mixin<P>(styles: any, props?: P) : P`

mixin() is a utility function for use with React which takes the
props object for a component and adds the necessary additional
'className' and/or 'style' props to apply styling from
a style returned by create(). 'styles' can be a single
style or an array of styles.

## ts-style

`ts-style` is a command-line utility which takes as
input a list of JavaScript files containing
(directly or indirectly via required modules)
`style.create()` calls. It loads each of the JavaScript
files using `require()` and then generates CSS for each
of the styles in the registry.

Usage: `ts-style <filename>...`
