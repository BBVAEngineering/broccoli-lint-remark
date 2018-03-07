'use strict';

const testGenerators = require('aot-test-generators');

const _generators = {};

Object.keys(testGenerators).forEach((name) => {
	const testGenerator = testGenerators[name];

	_generators[name] = function(relativePath, results) {
		const passed = hasPassed(results);
		const message = createAssertionMessage(relativePath, results);

		return (
			testGenerator.suiteHeader(`RemarkLint | ${relativePath}`) +
			testGenerator.test('should pass RemarkLint', passed, message) +
			testGenerator.suiteFooter()
		);
	};

	_generators[name].testOnly = function(relativePath, results) {
		const passed = hasPassed(results);
		const message = createAssertionMessage(relativePath, results);

		return testGenerator.test(relativePath, passed, message);
	};

	_generators[name].header = function(group) {
		return testGenerator.suiteHeader(`RemarkLint | ${group}`);
	};

	_generators[name].footer = function() {
		return testGenerator.suiteFooter();
	};
});

function render(results) {
	results = results || [];

	return results
		.filter((result) => result.fatal)
		.map((result) => `${result.name} - ${result.reason} (${result.ruleId})`)
		.join('\n');
}

function hasPassed(results) {
	results = results || [];

	return !results.find((result) => result.fatal);
}

function createAssertionMessage(relativePath, results) {
	let message = `${relativePath} should pass RemarkLint`;
	const passed = hasPassed(results);

	if (!passed) {
		message += `\n\n${render(results)}`;
	}

	return message;
}

module.exports = _generators;
