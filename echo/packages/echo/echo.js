async function _command(params, text, secrets = {}) {
  const {
    msg
  } = params;

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: msg
  };
}

const main = async (args) => ({
  body: await _command(args.params, args.commandText, args.__secrets || {}).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
