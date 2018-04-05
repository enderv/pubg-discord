const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const fileName = 'config.json';

function WriteToConfigFile(data) {
  return fs.writeFileAsync(fileName, JSON.stringify(data, null, 2));
}

function ReadConfigFile() {
  return fs.readFileAsync(fileName).then((data) => {
    return JSON.parse(data);
  })
}

module.exports = {
  WriteToConfigFile,
  ReadConfigFile
}