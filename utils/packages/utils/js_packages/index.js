// jshint esversion: 9

let readInstalled;

async function get_package_list() {
  return new Promise((resolve, reject) => {
    readInstalled('/', { depth: 0, dev: true }, (err, pkgs) => {
      let list = Object.entries(pkgs.dependencies).map(([k, v]) => `${k}: ${v.homepage}`);
      let str  = 'packages:\n' + list.join('\n');
      resolve(str);
    });
  });
}

async function _command(params, commandText, secrets = {}) {
  // We keep the package in a global for performance reasons. Globals are kept when a
  // container is re-used so keeping the package global means it will only be loaded when
  // a container is initialized

  if (!readInstalled) {
    readInstalled = require('read-installed');
  }

  let str = await get_package_list();
  return {
    response_type: 'in_channel',
    text: str
  };
}

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports.main = main;
