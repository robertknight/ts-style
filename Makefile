TSC_OPTS=--module commonjs --target es5 --noImplicitAny

all_srcs=$(wildcard src/*.ts)
compiled_srcs=$(subst src, build, $(patsubst %.ts,%.js,$(all_srcs)))

all: dist/cli.js dist/style.js dist/ts-style.d.ts

$(compiled_srcs): $(all_srcs)
	./node_modules/.bin/tsc $(TSC_OPTS) $(all_srcs) --outDir build --declaration
	mkdir -p dist

dist/cli.js: $(compiled_srcs)
	echo "#!/usr/bin/env node\n" > $@
	cat build/cli.js >> $@

dist/style.js: $(compiled_srcs)
	cp build/style.js dist

dist/ts-style.d.ts: $(compiled_srcs)
	./dts-bundle.js build/style.d.ts ts-style
	cp build/ts-style.d.ts $@

test: $(compiled_srcs)
	mocha $(wildcard build/*_test.js)

lint: $(all_srcs)
	./node_modules/.bin/tslint $(addprefix  -f , $?)

clean:
	rm -rf build dist
