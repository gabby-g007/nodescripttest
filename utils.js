const constants = require('./constants');
require('dotenv').config();

const generateOptions=(_path)=>{
    return options = {
        hostname: constants.hostname+_path,
        headers: { 
            'Authorization': `Basic ${Buffer.from(`:${process.env.AZURE_TOKEN}`).toString('base64')}`
        }
    }
}

module.exports ={ generateOptions }