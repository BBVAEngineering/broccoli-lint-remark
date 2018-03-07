# broccoli-lint-remark

[![Build Status](https://travis-ci.org/BBVAEngineering/broccoli-lint-remark.svg?branch=master)](https://travis-ci.org/BBVAEngineering/broccoli-lint-remark)
[![GitHub version](https://badge.fury.io/gh/BBVAEngineering%2Fbroccoli-lint-remark.svg)](https://badge.fury.io/gh/BBVAEngineering%2Fbroccoli-lint-remark)
[![npm version](https://badge.fury.io/js/broccoli-lint-remark.svg)](https://badge.fury.io/js/broccoli-lint-remark)
[![Dependency Status](https://david-dm.org/BBVAEngineering/broccoli-lint-remark.svg)](https://david-dm.org/BBVAEngineering/broccoli-lint-remark)

[Broccoli](https://github.com/broccolijs/broccoli) wrapper for [remark-lint](https://github.com/remarkjs/remark-lint).

## Information

[![NPM](https://nodei.co/npm/broccoli-lint-remark.png?downloads=true&downloadRank=true)](https://nodei.co/npm/broccoli-lint-remark/)

## Installation

```
npm install --save-dev broccoli-lint-remark
```

### API

- `inputNode` A [Broccoli node](https://github.com/broccolijs/broccoli/blob/master/docs/node-api.md)

- `options` {Object}: Options to control how `broccoli-markdown-test` is run.

  - `quiet` {Boolean}: Whether to ignore processed files without any messages in the report. 

    Default: `true`

  - `testGenerator` (Accepts two different types of input)
    - `String`: The framework used to test the markdown. You can provide a string one of the predefined test generators is used. Currently supported are `qunit` and `mocha`.
    - {`function(relativePath, results), returns test output string`}: The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.
      - `relativePath` {String}: The relative path to the file being tested.
      - `asserts` {Array}: List of assertions made from codeTransforms.

    Default: `null`.

    Example usage with a `String`:

    ```javascript
    return  new MarkdownTest(inputNode, {
      testGenerator: 'qunit'
    });
    ```

    Example usage with a `Function`:

    ```javascript
    return new MarkdownTest(inputNode, {
      testGenerator(relativePath, results) {
        // Do something to generate the test
      }
    });
    ```

  - `persist` {Boolean}: Persist the state of filter output across restarts

    Default: `false`.

  - `codeTransforms` {Object}: An object with codefences types and functions for converting code to code assertions. By default, there are implemented `javascript`, `html` and `json` code transforms. This option is merged with defaults.

    Example usage:

    ```javascript
      var path = require('path');

      return new MarkdownTest(inputNode, {
        testGenerator: 'qunit',
        codeTransforms: {
          text: (code) => "console.log('" + code + "');"
        }
      });
    ```

## Contribute

If you want to contribute to this addon, please read the [CONTRIBUTING.md](CONTRIBUTING.md).

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/BBVAEngineering/broccoli-lint-remark/tags).

## Authors

See the list of [contributors](https://github.com/BBVAEngineering/broccoli-lint-remark/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
