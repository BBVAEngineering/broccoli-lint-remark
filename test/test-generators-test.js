const expect = require('chai').expect;
const testGenerators = require('../lib/test-generators');

const FAIL = [{
	name: 'file.md:42:13',
	reason: 'This is not a valid foo',
	ruleId: 'validate-foo',
	fatal: true
}, {
	name: 'file.md:123:1',
	reason: 'foobar',
	ruleId: 'comma-dangle',
	fatal: true
}];

describe('test-generators', function() {
	describe('qunit', function() {
		before(function() {
			this.generate = testGenerators.qunit;
		});

		it('generates passing test for missing errorCount', function() {
			expect(this.generate('some/file.md', null).trim()).to.equal(`
QUnit.module('RemarkLint | some/file.md');
QUnit.test('should pass RemarkLint', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.md should pass RemarkLint');
});`.trim());
		});

		it('generates passing test for errorCount == 0', function() {
			expect(this.generate('some/file.md', [{}]).trim()).to.equal(`
QUnit.module('RemarkLint | some/file.md');
QUnit.test('should pass RemarkLint', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.md should pass RemarkLint');
});`.trim());
		});

		it('renders error messages', function() {
			expect(this.generate('some/file.md', FAIL).trim()).to.equal(`
QUnit.module('RemarkLint | some/file.md');
QUnit.test('should pass RemarkLint', function(assert) {
  assert.expect(1);
  assert.ok(false, 'some/file.md should pass RemarkLint\\n\\nfile.md:42:13 - This is not a valid foo (validate-foo)\\nfile.md:123:1 - foobar (comma-dangle)');
});`.trim());
		});

		describe('testOnly', function() {
			it('generates passing test for missing errorCount', function() {
				expect(this.generate.testOnly('some/file.md', null).trim()).to.equal(`
QUnit.test('some/file.md', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.md should pass RemarkLint');
});`.trim());
			});

			it('generates passing test for errorCount == 0', function() {
				expect(this.generate.testOnly('some/file.md', []).trim()).to.equal(`
QUnit.test('some/file.md', function(assert) {
  assert.expect(1);
  assert.ok(true, 'some/file.md should pass RemarkLint');
});`.trim());
			});

			it('renders error messages', function() {
				expect(this.generate.testOnly('some/file.md', FAIL).trim()).to.equal(`
QUnit.test('some/file.md', function(assert) {
  assert.expect(1);
  assert.ok(false, 'some/file.md should pass RemarkLint\\n\\nfile.md:42:13 - This is not a valid foo (validate-foo)\\nfile.md:123:1 - foobar (comma-dangle)');
});`.trim());
			});
		});
	});

	describe('mocha', function() {
		before(function() {
			this.generate = testGenerators.mocha;
		});

		it('generates passing test for missing errorCount', function() {
			expect(this.generate('some/file.md', null).trim()).to.equal(`
describe('RemarkLint | some/file.md', function() {
  it('should pass RemarkLint', function() {
	// test passed
  });
});`.trim());
		});

		it('generates passing test for errorCount == 0', function() {
			expect(this.generate('some/file.md', []).trim()).to.equal(`
describe('RemarkLint | some/file.md', function() {
  it('should pass RemarkLint', function() {
	// test passed
  });
});`.trim());
		});

		it('renders error messages', function() {
			expect(this.generate('some/file.md', FAIL).trim()).to.equal(`
describe('RemarkLint | some/file.md', function() {
  it('should pass RemarkLint', function() {
	// test failed
	var error = new chai.AssertionError('some/file.md should pass RemarkLint\\n\\nfile.md:42:13 - This is not a valid foo (validate-foo)\\nfile.md:123:1 - foobar (comma-dangle)');
	error.stack = undefined;
	throw error;
  });
});`.trim());
		});

		describe('testOnly', function() {
			it('generates passing test for missing errorCount', function() {
				expect(this.generate.testOnly('some/file.md', null).trim()).to.equal(`
  it('some/file.md', function() {
	// test passed
  });`.trim());
			});

			it('generates passing test for errorCount == 0', function() {
				expect(this.generate.testOnly('some/file.md', []).trim()).to.equal(`
  it('some/file.md', function() {
	// test passed
  });`.trim());
			});

			it('renders error messages', function() {
				expect(this.generate.testOnly('some/file.md', FAIL).trim()).to.equal(`
  it('some/file.md', function() {
	// test failed
	var error = new chai.AssertionError('some/file.md should pass RemarkLint\\n\\nfile.md:42:13 - This is not a valid foo (validate-foo)\\nfile.md:123:1 - foobar (comma-dangle)');
	error.stack = undefined;
	throw error;
  });`.trim());
			});
		});
	});
});
