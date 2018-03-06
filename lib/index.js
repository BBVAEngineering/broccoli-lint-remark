'use strict';

const path = require('path');
const Filter = require('broccoli-persistent-filter');
const md5Hex = require('md5-hex');
const extensions = require('markdown-extensions');
const stringify = require('json-stable-stringify');
const testGenerators = require('./test-generators');
const remarkEngine = require('./remark-engine');
const testGeneratorNames = Object.keys(testGenerators);

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
    throw new Error('BroccoliRemark can only handle one:* broccoli nodes, but part of the given input pipeline is a many:* node.' +
					'(broccoli-merge-trees is an example of a many:* node) Please perform many:* operations after linting.');
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
    persist: options.persist
  });

  this.remarkrc = resolveInputDirectory(inputNode);
  this.options = options;

  if (typeof this.options.testGenerator === 'string') {
    this.testGenerator = testGenerators[this.options.testGenerator];

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
  return path.join(__dirname, '..');
};

BroccoliRemark.prototype.cacheKeyProcessString = function(content, relativePath) {
  function functionStringifier(key, value) {
    if (typeof value === 'function') {
      return value.toString();
    }
    return value;
  }

  return md5Hex([
    content,
    relativePath,
    stringify(this.options, { replacer: functionStringifier })
  ]);
};

BroccoliRemark.prototype.processString = function processString(content, relativePath) {
  return remarkEngine(this.remarkrc, relativePath)
    .then((results) => {
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
};

BroccoliRemark.prototype.postProcess = function postProcess(report /* , relativePath */) {
  return { output: report.output };
};

Object.defineProperty(BroccoliRemark, 'testGenerators', {
  get() {
    return testGeneratorNames.slice(0);
  }
});

module.exports = BroccoliRemark;
