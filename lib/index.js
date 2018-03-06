'use strict';

const Filter = require('broccoli-persistent-filter');
const md5Hex = require('md5-hex');
const testGenerators = require('./test-generators');
const testGeneratorNames = Object.keys(testGenerators);
const remark = require('remark');
const reporter = require('vfile-reporter');
const engine = require('unified-engine');
const extensions = require('markdown-extensions');

function resolveInputDirectory(inputNode) {
  if (typeof inputNode === 'string') {
    return inputNode;
  }

  // eslint-disable-next-line no-underscore-dangle
  const nodeInfo = inputNode.__broccoliGetInfo__();

  if (nodeInfo.nodeType === 'source') {
    return nodeInfo.sourceDirectory;
  }

  if (nodeInfo.inputNodes.length > 1) {
    // eslint-disable-next-line max-len
    throw new Error('EslintValidationFilter can only handle one:* broccoli nodes, but part of the given input pipeline is a many:* node. (broccoli-merge-trees is an example of a many:* node) Please perform many:* operations after linting.');
  }

  return resolveInputDirectory(nodeInfo.inputNodes[0]);
}

function BroccoliRemark(inputNode, _options) {
	if (!(this instanceof BroccoliRemark)) {
		return new BroccoliRemark(inputNode, _options);
	}

	const options = _options || {};

	if (!options.hasOwnProperty('persist')) {
		options.persist = true;
	}

	Filter.call(this, inputNode, {
		annotation: options.annotation,
		persist: false //options.persist
	});

	this.options = options;
	this.console = this.options.console || console;
  this.options.reporter = this.options.reporter || reporter;
  this.remarkrc = resolveInputDirectory(inputNode);

  if (typeof this.options.testGenerator === 'string') {
    this.testGenerator = testGenerators[this.options.testGenerator];
    if (this.options.group && this.testGenerator) {
      this.testGenerator = this.testGenerator.testOnly;
    }
    if (!this.testGenerator) {
      throw new Error(`Could not find '${this.options.testGenerator}' test generator.`);
    }
  } else {
    this.testGenerator = this.options.testGenerator;
  }
}

BroccoliRemark.prototype = Object.create(Filter.prototype);
BroccoliRemark.prototype.constructor = BroccoliRemark;

BroccoliRemark.prototype.extensions = extensions;
BroccoliRemark.prototype.targetExtension = 'remark-test.js';

BroccoliRemark.prototype.baseDir = function() {
	return __dirname;
};

BroccoliRemark.prototype.cacheKeyProcessString = function(content, relativePath) {
	return md5Hex([
		content,
		relativePath,
    JSON.stringify(this.options)
	]);
};


BroccoliRemark.prototype.processString = function processString(content, relativePath) {
  // console.log(this.remarkrc, relativePath)

  const promise = new Promise((res, rej) => {
    engine({
      processor: remark(),
      name: 'remark',
      pluginPrefix: 'remark',
      presetPrefix: 'remark-preset',
      packageField: 'remarkConfig',
      rcName: '.remarkrc',
      ignoreName: '.remarkignore',
      cwd: this.remarkrc,
      // reporter: this.options.reporter,
      files: [relativePath],
      // filePath: relativePath,
      // streamIn,
      color: true,
      output: false
    }, (err, code, context) => {
      if (err){
        rej(err);
      } else {
        const file = context.files[0];

        res(file.messages);
      }
    });
  }).then((results) => {
    let output;

    results = results
      // Transform to raw object
      .map((result) => Object.assign({}, result))
      // Filter ignored files
      .filter((result) => result.ruleId && result.fatal);

    if (this.testGenerator && Array.isArray(results) && results.length) {
      output = this.testGenerator(relativePath, results);
    }

    return {
      results,
      output
    }
  });

  return promise;
};

BroccoliRemark.prototype.postProcess = function postProcess(report /* , relativePath */) {
  const results = report.results;

  if (results && results.length) {
    // log formatter output
    this.console.log(...results.map((result) => result.toString()));
  }

  return { output: report.output };
};

// BroccoliRemark.prototype.processString = function(contents, relativePath) {
// 	const { appName, annotation, iterations, threshold } = this.options;
// 	const [, family, name] = relativePath.match(/^.+\/([^\/]+)\/([^\/]+)\/README\.md$/);

// 	const tests = mdContent.filter((md) => md.tag === 'code' && md.info === 'hbs').map((md, index) => {
// 		return `
// 			test('Block code "${md.info}" #${index}', function(assert) {
// 				assert.expect(0);

// 				this.render(hbs \`${md.content}\`);
// 			});
// 		`;
// 	}).join('\n');

// 	return `
// 		import { moduleForComponent, test } from 'ember-qunit';
// 		import hbs from 'htmlbars-inline-precompile';

// 		moduleForComponent('${family}/${name}', '${annotation} | Docs | ${family}/${name}', {
// 			integration: true,
// 			beforeEach() {
// 				window.model = Ember.Object.create();
// 			}
// 		});
// 		` + tests;
// };

Object.defineProperty(BroccoliRemark, 'testGenerators', {
  get() {
    return testGeneratorNames.slice(0);
  }
});

module.exports = BroccoliRemark;
