/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import chai = require('chai');
import style = require('./style');

var assert = chai.assert;

function stripSpaces(str: string) {
	return str.replace(/\s/g, '');
}

var styles = style.create({
	button: {
		borderRadius: 3,
		backgroundColor: 'red',

		pressed: {
			backgroundColor: 'green'
		}
	},

	buttonB: {
		'::pseudo-selector': {
			color: 'green'
		}
	}
});

describe('style.create()', () => {
	it('should register styles', () => {
		var length = Object.keys(style.registry.styles()).length;
		var newStyle = style.create({
			a: {
				foo: {
					backgroundColor: 'white'
				}
			}
		});
		assert.equal(Object.keys(style.registry.styles()).length, length+1);
		assert.equal(style.registry.styles()['a'], newStyle.a);
	});
});

describe('style.classes()', () => {
	it('should convert property names to CSS class names', () => {
		assert.equal(style.classes(styles.button), 'button');
	});

	it('should add hyphens between nested property names', () => {
		assert.equal(style.classes(styles.button.pressed), 'button-pressed');
	});

	it('should not add hyphens to property names not starting with a lower-case letter', () => {
		assert.equal(style.classes(styles.buttonB['::pseudo-selector']),
		  'buttonB::pseudo-selector');
	});

	it('should add spaces between class names', () => {
		assert.equal(style.classes(styles.button, styles.button.pressed),
		  'button button-pressed');
	});
});

describe('style.compile()', () => {
	it('should generate CSS', () => {
		assert.equal(stripSpaces(style.compile(styles.button)),
					 stripSpaces('.button { border-radius: 3px; background-color: red; }' +
								 '.button-pressed { background-color: green; }'));
	});

	it('should not add hyphens to nested pseudo-selectors', () => {
		assert.equal(stripSpaces(style.compile(styles.buttonB)),
		             stripSpaces('.buttonB::pseudo-selector { color: green; }'));
	});

	it('should suffix numeric values with px', () => {
		var widgetStyle = style.create({widget: {top: 5}});
		assert.equal(stripSpaces(style.compile(widgetStyle)),
		             stripSpaces('.widget { top: 5px; }'));
	});

	it('should not suffix non-length properties with px', () => {
		var widgetStyle = style.create({widget: {opacity: 0.2}});
		assert.equal(stripSpaces(style.compile(widgetStyle)),
		             stripSpaces('.widget { opacity: 0.2; }'));
	});
});

describe('style.mixin()', () => {
	it('should add className property for single style', () => {
		assert.deepEqual(style.mixin(styles.button, {label: 'Hello'}),
		                 {className: 'button', label: 'Hello'});
	});

	it('should add className property for style array', () => {
		assert.deepEqual(style.mixin([styles.button, styles.buttonB], {label: 'Foo'}),
		                 {className: 'button buttonB', label: 'Foo'});
	});

	it('should use inline styles to resolve conflicts', () => {
		var styles = style.create({
			styleA: {
				color: 'green',
				fontWeight: 'bold'
			},
			styleB: {
				color: 'blue',
				fontSize: 15
			}
		});
		assert.deepEqual(style.mixin([styles.styleB, styles.styleA]),
		                 {className: 'styleB styleA', style: {color: 'green'}});
	});

	it('should use inline styles for plain objects', () => {
		assert.deepEqual(style.mixin({opacity: 0}),
		                 {style: {opacity: 0}});
	});

	it('should allow null style', () => {
		assert.deepEqual(style.mixin(null), {});
	});

	it('should allow null style in array', () => {
		var styles = style.create({
			styleA: {},
			styleB: {}
		});
		assert.deepEqual(style.mixin([styles.styleA, null, styles.styleB]),
		                 {className: 'styleA styleB'});
	});
});

describe('style.merge()', () => {
	it('should merge style objects in order', () => {
		var mixins = style.create({
			mixinA: { fontWeight: 'bold', fontSize: 12 },
			mixinB: { fontSize: 14 }
		});
		var styles = style.create({
			merged: style.merge(mixins.mixinA, mixins.mixinB, {
				color: 'green'
			})
		});
		var css = style.compile(styles);
		assert.equal(stripSpaces(css),
		             stripSpaces('.merged { font-weight: bold; font-size: 14px; color: green; }'));
	});
});

describe('Style.mixins', () => {
	it('should add classes for mixins ', () => {
		var mixins = style.create({
			mixinA: { fontWeight: 'bold' }
		});
		var styles = style.create({
			merged: {
				mixins: [mixins.mixinA],
				color: 'green'
			}
		});
		var css = style.compile(styles);
		assert.equal(stripSpaces(css),
		             stripSpaces('.merged { color: green; }'));

		assert.deepEqual(style.mixin(styles.merged), {
			className: 'mixinA merged'
		});
	});

	it('should use inline styles to resolve conflicts', () => {
		var mixins = style.create({
			mixinA: { fontSize: 12, fontWeight: 'bold', backgroundColor: 'red' },
			mixinB: { fontSize: 13, color: 'green' }
		});
		var styles = style.create({
			merged: {
				mixins: [mixins.mixinA, mixins.mixinB],
				fontWeight: 'normal'
			}
		});
		assert.deepEqual(style.mixin(styles.merged), {
			className: 'mixinA mixinB merged',
			style: {
				fontSize: 13,
				fontWeight: 'normal'
			}
		});
	});
});
