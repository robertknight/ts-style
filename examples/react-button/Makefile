NODE_BIN=$(PWD)/node_modules/.bin
TSC=$(NODE_BIN)/tsc --module commonjs --target es5
TSD=$(NODE_BIN)/tsd

all: typings build/bundle.js build/theme.css

# process the style.create() calls in our
# app to generate the CSS.
#
# In this app, the styling lives in the same
# files as the component, but in larger apps
# you may want to split component styling
# into a separate bundle.
build/theme.css: build/bundle.js
	$(NODE_BIN)/ts-style build/index.js > $@

build/bundle.js: $(wildcard *.ts) node_modules
	$(TSC) $< --outDir build
	$(NODE_BIN)/browserify build/index.js > $@

node_modules: package.json
	npm install .
	touch node_modules

typings: tsd.json node_modules
	$(TSD) reinstall
	touch typings

clean:
	rm -rf build typings node_modules
