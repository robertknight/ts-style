/// <reference path="../typings/tsd.d.ts" />

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
});

