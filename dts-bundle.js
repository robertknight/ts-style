#!/usr/bin/env node

// this script takes a .d.ts file generated
// by the TypeScript compiler and converts it
// into a type definition file for a module
// with a given name, suitable for bundling
// with an npm package
//
// Usage: dts-bundle.js <definitions file> <module name>

var entry = process.argv[2]
var name = process.argv[3]

var dts_bundle = require('dts-bundle');

dts_bundle.bundle({
	name: name,
	main: entry
});
