/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.assign
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

function assign(target: Object, ...sources: Object[]) {
	if (target == null) {
		throw new TypeError('Object.assign target cannot be null or undefined');
	}

	var to = Object(target);
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	sources.forEach((nextSource) => {
		if (nextSource == null) {
			return;
		}

		var from = Object(nextSource);

		// We don't currently support accessors nor proxies. Therefore this
		// copy cannot throw. If we ever supported this then we must handle
		// exceptions and side-effects. We don't support symbols so they won't
		// be transferred.
		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}
	});

	return to;
};

export = assign;
