const fetch = require('node-fetch');

async function getFileContent()
{
    url = 'https://dev.azure.com/gabbyg/WMSapp/_apis/sourceProviders/tfsgit/filecontents?&repository=WMS&commitOrBranch=Dev&path=/LES/src/cmdsrc/usrint/add_usr_on_time_loading_carrier_reason_code-2.mcmd&api-version=7.0';
    const names = await fetch(url);
    const textData = names.text();
    return textData;

}
module.exports = getFileContent