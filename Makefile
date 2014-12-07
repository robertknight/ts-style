TSC_OPTS=--module commonjs --target es5 --noImplicitAny

all_srcs=$(wildcard src/*.ts)
compiled_srcs=$(subst src, build, $(patsubst %.ts,%.js,$(all_srcs)))

all: dist/cli.js dist/style.js

$(compiled_srcs): $(all_srcs)
	./node_modules/.bin/tsc $(TSC_OPTS) $(all_srcs) --outDir build --declaration

dist/cli.js: $(compiled_srcs)
	mkdir -p dist
	echo "#!/usr/bin/env node\n" > $@
	cat build/cli.js >> $@

dist/style.js: $(compiled_srcs)
	mkdir -p dist
	cp build/style.js build/style.d.ts dist

test: $(compiled_srcs)
	mocha $(wildcard build/*_test.js)

lint: $(all_srcs)
	./node_modules/.bin/tslint $(addprefix  -f , $?)

