// jshint esversion: 9

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {

  return {
    response_type: 'in_channel', // or `ephemeral` for private response
    text: `
    WHO’s standard recommendations for the general public to reduce exposure to and transmission of a range of illnesses are as follows, which include hand and respiratory hygiene, and safe food practices:
    
    - Frequently clean hands by using alcohol-based hand rub or soap and water;
    - When coughing and sneezing cover mouth and nose with flexed elbow or tissue – throw tissue away immediately and wash hands;
    - Avoid close contact with anyone who has fever and cough;
    - If you have fever, cough and difficulty breathing seek medical care early and share previous travel history with your health care provider;
    - When visiting live markets in areas currently experiencing cases of novel coronavirus, avoid direct unprotected contact with live animals and surfaces in contact with animals;
    - The consumption of raw or undercooked animal products should be avoided. Raw meat, milk or animal organs should be handled with care, to avoid cross-contamination with uncooked foods, as per good food safety practices.`
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({ __secrets = {}, commandText, ...params }) => ({ body: await _command(params, commandText, __secrets) });
module.exports = main;
