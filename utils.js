const constants = require('./constants');
require('dotenv').config();

const generateOptions = (_path) => {
    let options = {
        hostname: constants.hostname + _path,
        headers: {
            'Authorization': `Basic ${Buffer.from(':' + process.env.AZURE_TOKEN).toString('base64')}`
        }
    }
    return options;
}

module.exports = { generateOptions }