'use strict';

const path = require('path');
const expect = require('./chai').expect;
const co = require('co');
const testHelpers = require('broccoli-test-helper');
const BroccoliRemark = require('..');
const fs = require('fs-extra');
const Funnel = require('broccoli-funnel');
const extensions = require('markdown-extensions');

const createBuilder = testHelpers.createBuilder;
const createTempDir = testHelpers.createTempDir;

const _console = console

describe('broccoli-lint-remark', function() {
  let input, output, console;

  beforeEach(co.wrap(function *() {
    input = yield createTempDir();
    // console = {
    //   log(line) {}
    // };
    const modulesPath = path.join(process.cwd(), 'node_modules');
    const modulesTmpPath = path.join(input.path(), 'node_modules');
    // Clone "node_modules" no tmp dir.
    fs.ensureSymlinkSync(modulesPath, modulesTmpPath);
  }));

  afterEach(co.wrap(function *() {
    yield input.dispose();
    if (output) {
      yield output.dispose();
    }
  }));

  it('exports a static immutable "testGenerators" list', function() {
    expect(BroccoliRemark.testGenerators).to.deep.equal(['qunit', 'mocha']);

    BroccoliRemark.testGenerators.push('jest');

    expect(BroccoliRemark.testGenerators).to.deep.equal(['qunit', 'mocha']);
  });

  // it('logs errors to the console (using factory function)', co.wrap(function *() {
  //   input.write({
  //     '.remarkrc': `{
  //       "plugins": [
  //         ["remark-lint-final-newline", [2]]
  //       ]
  //     }`,
  //     'a.md': `# Title A`
  //   });

  //   let messages = [];
  //   let console = {
  //     log(message) {
  //       messages.push(message);
  //     }
  //   };
  //   const tree = new Funnel(input.path(), { include: ['*.md'] })
  //   const pluginInstance = BroccoliRemark(tree, { console });

  //   output = createBuilder(pluginInstance);

  //   yield output.build();

  //   expect(messages.join('')).to.contain(`a.md:1:1: Missing newline character at end of file`);
  // }));

  it('generates test files by default', co.wrap(function *() {
    input.write({
      '.remarkrc': `{ "plugins": [["remark-lint-final-newline", [2]]] }`,
      'a.md': `# Title A`,
      'b.md': `# Title B`
    });

    const tree = new Funnel(input.path(), { include: ['*.md'] })
    const pluginInstance = BroccoliRemark(tree);

    output = createBuilder(pluginInstance);

    yield output.build();

    expect(Object.keys(output.read())).to.deep.equal(['a.remark-test.js', 'b.remark-test.js']);
  }));

  it('generates test files for any kind of markdown file', co.wrap(function *() {
    const files = extensions.reduce((acc, ext, index) => {
      acc[`${index}.${ext}`] = '';
      return acc;
    }, {});
    const outputFiles = extensions.map((file, index) => `${index}.remark-test.js`);

    input.write(files);

    const tree = new Funnel(input.path(), { include: ['*.*'] })
    const pluginInstance = BroccoliRemark(tree);

    output = createBuilder(pluginInstance);

    yield output.build();

    expect(Object.keys(output.read())).to.deep.equal(outputFiles);
  }));


  describe('testGenerator', function() {
    it('qunit: generates QUnit tests', co.wrap(function *() {
      input.write({
        '.remarkrc': `{ "plugins": [["remark-lint-final-newline", [2]]] }`,
        'a.md': `# Title A`
      });

      const tree = new Funnel(input.path(), { include: ['*.*'] })
      const pluginInstance = BroccoliRemark(tree, { testGenerator: 'qunit' });

      output = createBuilder(pluginInstance);

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['a.remark-test.js']);
      expect(result['a.remark-test.js'].trim()).to.equal([
        `QUnit.module('RemarkLint | a.md');`,
        `QUnit.test('should pass RemarkLint', function(assert) {`,
        `  assert.expect(1);`,
        `  assert.ok(false, 'a.md should pass RemarkLint\\n\\na.md:1:1 - Missing newline character at end of file (final-newline)');`,
        `});`,
      ].join('\n'));
    }));

    it('mocha: generates Mocha tests', co.wrap(function *() {
      input.write({
        '.remarkrc': `{ "plugins": [["remark-lint-final-newline", [2]]] }`,
        'a.md': `# Title A`
      });

      const tree = new Funnel(input.path(), { include: ['*.*'] })
      const pluginInstance = BroccoliRemark(tree, { testGenerator: 'mocha' });

      output = createBuilder(pluginInstance);

      yield output.build();

      let result = output.read();
      expect(Object.keys(result)).to.deep.equal(['a.remark-test.js']);
      expect(result['a.remark-test.js'].trim()).to.equal([
        `describe('RemarkLint | a.md', function() {`,
        `  it('should pass RemarkLint', function() {`,
        `    // test failed`,
        `    var error = new chai.AssertionError('a.md should pass RemarkLint\\n\\na.md:1:1 - Missing newline character at end of file (final-newline)');`,
        `    error.stack = undefined;`,
        `    throw error;`,
        `  });`,
        `});`,
      ].join('\n'));
    }));

    it('custom: generates tests via custom test generator function', co.wrap(function *() {
      input.write({
        '.remarkrc': `{ "plugins": [["remark-lint-final-newline", [2]]] }`,
        'a.md': `# Title A`
      });

      let args = [];
      function testGenerator() {
        args.push(arguments);
      }

      const tree = new Funnel(input.path(), { include: ['*.*'] })
      const pluginInstance = BroccoliRemark(tree, { testGenerator });

      output = createBuilder(pluginInstance);

      yield output.build();

      expect(args).to.have.lengthOf(1);
      expect(args[0][0]).to.equal('a.md');

      const results = args[0][1];
      const result = results[0];
      expect(result.file).to.be.equal('a.md');

      expect(results).to.deep.equal([{
        message: 'Missing newline character at end of file',
        name: 'a.md:1:1',
        reason: 'Missing newline character at end of file',
        line: null,
        column: null,
        location: {
          start: { line: null, column: null },
          end: { line: null, column: null }
        },
        source: 'remark-lint',
        ruleId: 'final-newline',
        file: 'a.md',
        fatal: true
      }]);
    }));
  });
});
