const fs = require('fs');

const errors = {};

fs.readdirSync(__dirname)
  .filter((filename) => filename !== 'index.js')
  .forEach((filename) => {
    const error = require(`./${filename}`);
    errors[error.name] = error;
  });

module.exports = errors;
