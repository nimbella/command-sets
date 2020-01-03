// eslint-disable-next-line no-unused-vars
async function _command(params, text, secrets = {}) {
  const {msg} = params;

  return {
    // Or `ephemeral` for private response
    response_type: 'in_channel', // eslint-disable-line camelcase
    text: msg
  };
}

const main = async ({__secrets = {}, text, ...params}) => ({
  body: await _command(params, text, __secrets)
});
module.exports = main;
