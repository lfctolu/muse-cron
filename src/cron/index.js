const fs = require('fs');

const tasks = [];

fs.readdirSync(__dirname)
  .filter((filename) => filename !== 'index.js')
  .forEach((filename) => {
    tasks.push(require(`./${filename}`));
  });

module.exports = {
  start: () => tasks.forEach(task => task.start()),
  stop: () => tasks.forEach(task => task.stop()),
};
