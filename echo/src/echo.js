async function _command(params, text, secrets = {}) {
  const {
    msg
  } = params;

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: msg
  };
}

const main = async ({__secrets = {}, text, ...params}) => ({body: await _command(params, text, __secrets)});
module.exports = main;
