const crypto = require('crypto');
const execa = require('execa');
const platform = require('os').platform();
const fs = require('fs');
const MD5SUMREGEX = /^(.{32})/;
const MACMD5REGEX = /^MD5.+=\s*(.+)$/g;

/**
 * Calc file md5.
 * @param {String} fileName
 * @return {Promise} md5 value.
 */
function calcMd5(fileName) {
  const readStream = fs.createReadStream(fileName);
  let md5 = crypto.createHash('md5');
  return new Promise((resolve, reject) => {
    readStream.on('data', chunk => md5.update(chunk));
    readStream.on('error', reject);
    readStream.on('end', () => {
      let hash = md5.digest('hex');
      resolve(hash);
    })
  })
}

/**
 *
 * @param {String} command
 * @param {String} fileName
 * @param {RegExp} regex
 * @return {Promise.<String>}
 */
function nativeMd5(command, fileName, regex) {
  return execa(command, [fileName]).then(res => {
    const matches = regex.exec(res.stdout);
    if (matches.length === 2) {
      return matches[1]
    } else {
      return calcMd5(fileName);
    }
  }).catch(err => {
    console.error(err);
    return calcMd5(fileName);
  })
}

/**
 *
 * @param fileName
 * @return {Promise}
 */
module.exports = (fileName) => {
  switch (platform) {
    case 'darwin':
      return nativeMd5('md5', fileName, MACMD5REGEX);
      break;
    case 'linux':
      return nativeMd5('md5sum', fileName, MD5SUMREGEX);
      break;
    default:
      return calcMd5(fileName);
  }
}
