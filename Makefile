PWD = $(shell pwd)
TEST_REPORTER ?= dot
TEST_TIMEOUT ?= 2000
TEST_SLOW ?= 75
NODE_MODULES = $(PWD)/node_modules

test:
	@$(NODE_MODULES)/.bin/mocha --recursive \
			--timeout $(TEST_TIMEOUT) --slow $(TEST_SLOW) \
			-R $(TEST_REPORTER) $(TEST_ARGS)

.PHONY: test
