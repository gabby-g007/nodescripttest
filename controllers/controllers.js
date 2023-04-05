const { generateOptions } = require('../utils');
const https = require('https');
require('dotenv').config();
var axios = require('axios');

let organization = process.env.ORG;
let project = process.env.PROJECT;
let repoId = process.env.REPO_ID;

async function getBranchesLists() {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/stats/branches?api-version=7.0`)
    headers = options.headers;
    const response = await axios.get(options.hostname + options.path, { headers });
    return response.data.value;
}
async function getAllCommits() {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/commits`)
    headers = options.headers;
    const response = await axios.get(options.hostname + options.path, { headers });
    return response.data.value;
}
async function getAllFiles(commitId) {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/commits/${commitId}/changes`)
    headers = options.headers;
    const response = await axios.get(options.hostname + options.path, { headers });
    return response.data.changes;
}
async function getItemContent(filePath, commitId) {
    const options = generateOptions(`${organization}/${project}/_apis/sourceProviders/tfsgit/filecontents?&repository=${repoId}&commitOrBranch=${commitId}&path=${filePath}&api-version=7.0`);
    headers = options.headers;
    const response = await axios.get(options.hostname + options.path, { headers });
    
    return response.data;
}
module.exports = { getBranchesLists, getAllCommits, getAllFiles, getItemContent }
