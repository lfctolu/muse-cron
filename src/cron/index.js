const fs = require('fs');

const tasks = [];

fs.readdirSync(__dirname)
  // .filter((filename) => filename !== 'index.js')
  .filter((filename) => filename === 'pushNotificationCron.js')
  .forEach((filename) => {
    tasks.push(require(`./${filename}`));
  });

module.exports = () => tasks.forEach(task => task.start());
