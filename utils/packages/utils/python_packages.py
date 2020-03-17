import sys


"""
@description null
@param {ParamsType} params list of command parameters
@param {?string} commandText text message
@param {!object} [secrets = {}] list of secrets
@return {Promise<SlackBodyType>} Response body
"""
def _command(params, commandText, secrets):

  #DESTRUCTURED_ARGS = params[key];
  print(sys.modules.keys())

  return {
    "response_type": 'in_channel', # or `ephemeral` for private response
    "text": 'List of available python packages: \n' + ' , '.join(sys.modules.keys())
  }

"""
@typedef {object} SlackBodyType
@property {string} text
@property {'in_channel'|'ephemeral'} [response_type]
"""
def main(args):
    try:
       return { "body": _command(args['params'], args['commandText'], args['__secrets'])}
    except:
        return { "body": { "response_type": 'ephemeral', "text": 'Error: ' + sys.exc_info()[0] } }