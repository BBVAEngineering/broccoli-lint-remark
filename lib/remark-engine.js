'use strict';

const remark = require('remark');
const engine = require('unified-engine');

module.exports = (dir, relativePath, quiet) => new Promise((res, rej) => {
	engine({
		processor: remark(),
		name: 'remark',
		pluginPrefix: 'remark',
		presetPrefix: 'remark-preset',
		packageField: 'remarkConfig',
		rcName: '.remarkrc',
		ignoreName: '.remarkignore',
		cwd: dir,
		files: [relativePath],
		color: true,
		output: false,
		reporter: quiet ? () => {} : null
	}, (err, code, context) => {
		if (err){
			rej(err);
		} else {
			const file = context.files[0];

			res(file.messages);
		}
	});
});
