/// <reference path="node_modules/typed-react/typings/react/react.d.ts" />
/// <reference path="node_modules/typed-react/dist/typed-react.d.ts" />
/// <reference path="node_modules/ts-style/dist/ts-style.d.ts" />

import react = require('react');
import typed_react = require('typed-react');

import style = require('ts-style');

// use style.create() to create a set of
// styles for use in components.
//
// The returned object has the same structure
// as the input to style.create() but is augmented
// with data needed by other style functions
// (compile(), create(), mixin())

// The styles here are divided into two parts, 'mixins'
// which are shared pieces of styling used by different
// elements and 'theme', which are the styles for
// our component elements.
var mixins = style.create({
	clickable: {
		userSelect: 'none',
		cursor: 'pointer'
	}
});

var theme = style.create({
	// styling for our top-level view.
	// Elements that start with a lower-case
	// name are translated to CSS classes,
	// so this generates a '.app' selector
	app: {
		display: 'flex',

		// camel-case property values are hyphenated in
		// the generated CSS, so this becomes 'flex-direction'
		flexDirection: 'column',

		// numeric property values are suffixed with 'px'
		// in the generated CSS
		width: 100,

		marginLeft: 'auto',
		marginRight: 'auto'
	},

	button: {
		mixins: [mixins.clickable],

		backgroundColor: 'red',
		border: '1px solid red',
		borderRadius: 3,
		color: 'white',
		marginTop: 5,
		marginBottom: 5,
		padding: 5,
		
		// pseudo and descendant selectors can
		// be created using properties that
		// start with anything other than
		// a lower-case letter
		':active' : {
			backgroundColor: 'green'
		}
	}
});

interface ButtonProps {
	label: string;
}

class Button extends typed_react.Component<ButtonProps, {}> {
	render() {
		// use style.mixin() to merge the component's props
		// with the props ('className', 'style') needed
		// to apply styling from a theme element
		return react.DOM.input(style.mixin(theme.button, {
			type: 'button',
			value: this.props.label
		}));
	}
}
var ButtonF = react.createFactory(typed_react.createClass(Button));

class App extends typed_react.Component<{},{}> {
	render() {
		return react.DOM.div(style.mixin(theme.app),
		  ButtonF({label: 'Button One'}),
		  ButtonF({label: 'Button Two'})
		);
	}
}
var AppF = react.createFactory(typed_react.createClass(App));

// check that we are running in a browser before trying
// to render the component - this module is require'd by
// ts-style in order to generate CSS from the style.create()
// calls. An alternative approach is to put the style.create()
// calls in a separate file which contains no app logic
if (typeof document !== 'undefined') {
	react.render(AppF({}), document.getElementById('app'));
}

