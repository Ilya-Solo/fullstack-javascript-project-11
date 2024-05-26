install:
	npm ci

start:
	npx webpack serve

lint:
	npx eslint .

build:
	rm -rf dist & NODE_ENV=production npx webpack

build_production:
	NODE_ENV=production npx webpack