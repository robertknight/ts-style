# ts-style
[![Build Status](https://travis-ci.org/robertknight/ts-style.png?branch=master)](https://travis-ci.org/robertknight/ts-style)

ts-style is a library for
defining CSS styles using JavaScript or TypeScript,
primarily intended for use with front-end libraries like React where components
are defined in JavaScript. It has no dependencies on a specific
UI library.

For background on why you might want to do such a thing, see
[@vjeux](https://twitter.com/vjeux)'s talk on [CSS in JS](https://speakerdeck.com/vjeux/react-css-in-js),
or [this post on AbsurdJS](http://davidwalsh.name/write-css-javascript).

See also [React Style](https://github.com/js-next/react-style) for a library
specifically for defining styles for React components in JavaScript.

## Rationale

Using JavaScript to generate CSS styles allows re-use
of existing language facilities and tools for defining constants, mixins,
imports that CSS pre-processors like LESS or SASS are
often used for.

Using TypeScript for the code that defines the classes
and the code that references them additionally provides
compile-time checking that style references are valid
and allows use of tooling (eg. Visual Studio) for
navigating the code.

## Goals
 * Enable use of JavaScript/TypeScript language features
   and tooling for defining component styles
 * Generate simple, readable CSS that is easy to work with in browser dev tools.
 * No dependencies on a specific UI library, although ts-style is built
   with React in mind

## Basic Usage
Styles are created by passing an object defining class names
and their properties to `style.create()`. Style property names
are written in camelCase and converted to hyphenated-names
 when the CSS is generated. Numeric values are translated
 to 'px' units.

theme.js:

```javascript
var theme = style.create({
  button: {
    backgroundColor: 'green',
    width: 100,
    borderRadius: 3
  }
});
```

The CSS can then be generated using the __ts-style__ command-line tool or the API.  `ts-style theme.js` OR `style.compile(theme)` will generate this CSS:

```css
button {
  background-color: green;
  width: 100px;
  border-radius: 3px;
}
```

In the JS logic or templates that define the components
using the styles, rather than using string literals for
class names, use `style.mixin()` to get the list of CSS class names
and inline styles to apply to the UI element.

`style.mixin(theme.button)` will return:

```javascript
{
  className: 'button'
}
```

This can be used in a React component for example:

```javascript
var Button = React.createClass({
  render: function() {
    return React.DOM.div(style.mixin(theme.button),
      this.props.label);
  }
});
```

## Additional Features

### Namespaces

`style.create()` has an optional second argument which specifies a namespace
for generated CSS classes. If specified, it will be added as a prefix for generated
class names. If the namespace is a filename or path, the basename will be extracted and hyphenated.

````
// my_component.js
var theme = style.create({
  element: {
    backgroundColor: 'red'
  }
}, __filename);
````

Generates:
````
.my-component-element {
  background-color: 'red';
}
````

### Nested styles

The tree passed to `style.create()` can contain nested objects and parent
property names are used in the generated class names:

```javascript
var theme = style.create({
  button: {
    backgroundColor: 'red',
    disabled: {
      backgroundColor: 'white'
    }
  }
});
```

Generates:

```css
.button {
  background-color: red;
}

.button-disabled {
  background-color: white;
}
```

### Descendant and Pseudo-Selectors

Property names that begin with a lower-case letter become
CSS class selectors. Other property names are simply appended
to the selector for the containing object. This allows
pseudo and descendant selectors to be defined:

```javascript
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
```

Generates:

```css
.widget a {
  text-decoration: none;
}
.widget::active {
  font-weight: bold;
}
```

### Mixins

Style definitions can specify mixins. This is a list of styles
which will be used whenever the containing style is used.

For example:

```javascript
var mixins = style.create({
  disableSelection: {
    userSelect: 'none'
  }
});

var theme = style.create({
  button: {
    mixins: [mixins.disableSelection],
    font-weight: 'bold'
  }
});
```

`style.mixin(theme.button)` generates:

```css
{
   className: 'disable-selection button'
}
```

## Style Precedence

The order of classes in the generated CSS will match the
order of properties passed to `style.create()`.

The `style.mixin()` function takes an array of styles which is ordered
from lowest to highest precedence. Where there are conflicting property
values, inline styling is used to ensure the appropriate styling is applied
to the component.

## Core API

`create<T>(object: T): Style`

`create()` takes an object tree defining CSS classes and
returns an augmented object with the same structure.
Properties (or nested properties) of the object can
then be passed to `classes()` to get the corresponding
class names.

`compile(styles: Style): string`

`compile()` takes an object returned by `create()`
and generates the corresponding CSS classes.

`mixin<P>(styles: Style | Style[], props?: P): P`

mixin() takes a list of styles from an object created by
`style.create()` and returns an object with `className` and `style`
properties that should be used as the 'class' and 'style'
attributes for the DOM element respectively.

If `props` is specified, the properties from it are added to the returned
object. If you are using React, this allows you to pass the result of mixin()
as the props argument to a component's constructor.

The 'styles' array is ordered from lowest to highest precedence.
Where a property in a higher-precedence style conflicts with
a property in a lower-precedence style, the resulting object
will include a `style` property that contains the
attributes and final values for that property. When
the result of `style.mixin()` is passed to a React component
this results in inline styling on the DOM element.

For example:

```javascript
var styles = style.create({
	styleA: { color: 'green' },
	styleB: { color: 'blue' }
});
styles.mixin([styleB, styleA]);
```

Will generate:

```css
{ className: 'style-b style-a', style: { color: 'green' } }
```

## Utility APIs

`merge(...styles: any[])`

merge() is a utility function which takes one or more objects
from a style create created using `style.create()` and returns
an object which merges the style properties of all of the
input styles. This can be used to create styles which combine
the properties from other styles.

## Command Line Tools

### ts-style

`ts-style` is a command-line utility which takes as
input a list of JavaScript files containing
(directly or indirectly via required modules)
`style.create()` calls. It loads each of the JavaScript
files using `require()` and then generates CSS for each
of the styles in the registry.

Usage: `ts-style <filename>...`
