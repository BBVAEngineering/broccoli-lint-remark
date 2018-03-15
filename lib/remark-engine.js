'use strict';

const remark = require('remark');
const engine = require('unified-engine');

module.exports = (relativePath, options) => new Promise((res, rej) => {
	const config = Object.assign({
		processor: remark(),
		files: [relativePath]
	}, options);

	engine(config, (err, code, context) => {
		if (err) {
			rej(err);
		} else {
			const file = context.files[0];

			res(file.messages);
		}
	});
});
