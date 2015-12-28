TSC_OPTS=--module commonjs --target es5 --noImplicitAny

all_srcs=$(wildcard src/*.ts)
compiled_srcs=$(subst src, build, $(patsubst %.ts,%.js,$(all_srcs)))
compiled_nontest_srcs=$(patsubst %_test.js,,$(compiled_srcs))
dist_srcs=$(subst build, dist, $(compiled_nontest_srcs))

all: dist/cli.js dist/style.js dist/style.d.ts

typings: tsd.json
	./node_modules/.bin/tsd reinstall

$(compiled_srcs): $(all_srcs) typings
	./node_modules/.bin/tsc

dist:
	mkdir -p dist

$(dist_srcs): dist $(compiled_nontest_srcs)
	cp $(compiled_nontest_srcs) dist/
	echo '#!/usr/bin/env node' > dist/cli.js
	cat build/cli.js >> dist/cli.js
	chmod +x dist/cli.js

dist/style.d.ts: dist $(compiled_nontest_srcs)
	cp build/style.d.ts dist/

test: $(compiled_srcs)
	mocha $(wildcard build/*_test.js)

lint: $(all_srcs)
	./node_modules/.bin/tslint $?

clean:
	rm -rf build dist typings
