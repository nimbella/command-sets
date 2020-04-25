import re
import subprocess
import sys
import traceback

# need to install watson sdk
subprocess.check_call([sys.executable, "-m", "pip", "install", "watson_developer_cloud"])
from watson_developer_cloud import VisualRecognitionV3

# to decode urls that may need it e.g., <www.example.com>
URL_DECODER = re.compile('^<?([^|>]*)[|\w]*>?$')

# name of the api key and version of the watson service to use
API_KEY = 'ibmWatsonVisualRecognitionCredentials'
API_VERSION = '2018-03-19'

# name of the parameter that is expected
IMAGE_URL = 'imageUrl'

"""
@description null
@param {ParamsType} params list of command parameters
@param {?string} commandText text message
@param {!object} [secrets = {}] list of secrets
@return {Promise<SlackBodyType>} Response body
"""
def _command(params, commandText, secrets):
  if API_KEY not in secrets:
    return error('%s secret is missing' % API_KEY)
  elif IMAGE_URL not in params:
    return error('%s parameter is missing' % IMAGE_URL)
  else:
    # get image url from params
    image_url = params[IMAGE_URL][1:-1]
    matches = URL_DECODER.match(image_url)
    if matches is None:
      return error('%s parameter is invalid' % IMAGE_URL)
    else:
      image_url = matches.group(1)

  # init visual recognition library
  apiKey = secrets[API_KEY]
  version = API_VERSION
  visual_recognition = VisualRecognitionV3(version=version, iam_apikey=apiKey)

  # parse visual recognition return data for our tags
  tags = ''
  classifiedImages = visual_recognition.classify(url=image_url).get_result()
  image = classifiedImages['images'][0]
  classes = image['classifiers'][0]['classes']
  for theClass in classes:
    currentTag = theClass['class']
    print(currentTag)
    tags = tags + currentTag + ', '

  return {
    'response_type': 'in_channel',
    'attachments': [{
      'title': 'Analyzed %s' % image_url,
      'text': tags
    }]
  }

def error(msg):
  return {
    'response_type': 'in_channel',
    'text': 'Error: %s.' % msg
  }

"""
@typedef {object} SlackBodyType
@property {string} text
@property {'in_channel'|'ephemeral'} [response_type]
"""
def main(args):
    try:
       return { "body": _command(args['params'], args['commandText'], args['__secrets']) }
    except Exception as e:
      response = {
        "response_type": "ephemeral",
        "attachments":
        [{
          "title": "Function error: " + str(e),
          "color": "danger",
          "text": traceback.format_exc()
        }]
      }
      return { "body": response }
