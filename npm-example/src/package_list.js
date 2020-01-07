// jshint esversion: 9

let readInstalled;

// Installs a set of npm packges
async function install(pkgs) {
  pkgs = pkgs.join(' ');
  return new Promise((resolve, reject) => {
    const {exec} = require('child_process');
    exec(`npm install ${pkgs}`, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function getPackageList() {
  return new Promise((resolve, reject) => {
    readInstalled('/', {depth: 0, dev: true}, (err, pkgs) => {
      if (err) reject(err);

      const list = Object.entries(pkgs.dependencies).map(
        ([k, v]) => `${k}: ${v.homepage}`
      );
      const str = 'packages:\n' + list.join('\n');
      resolve(str);
    });
  });
}

// eslint-disable-next-line no-unused-vars
async function _command(params, commandText, secrets = {}) {
  // We keep the package in a global for performance reasons. Globals are kept when a
  // container is re-used so keeping the package global means it will only be loaded when
  // a container is initialized

  let str = '';
  try {
    if (!readInstalled) {
      await install(['read-installed']);
      readInstalled = require('read-installed');
    }

    str = await getPackageList();
  } catch (error) {
    str = error.message;
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    text: str
  };
}

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
