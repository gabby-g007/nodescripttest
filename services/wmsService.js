const { generateOptions } = require('../utils');
require('dotenv').config();
let axios = require('axios');
let organization = process.env.ORG;
let project = process.env.PROJECT;
let repoId = process.env.REPO_ID;

async function getBranchesList() {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/stats/branches?api-version=7.0`)
    const headers = options.headers;
    const response = await axios.get(options.hostname, { headers });
    return response.data.value;
}
async function getAllCommit(branch) {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/commits?searchCriteria.itemVersion.version=${branch}&api-version=7.0`);
    const headers = options.headers;
    const response = await axios.get(options.hostname, { headers });
    return response.data.value;
}
async function getAllFile(commitId) {
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/commits/${commitId}/changes`)
    const headers = options.headers;
    const response = await axios.get(options.hostname, { headers });
    return response.data.changes;
}

async function getItemContent(filePath, commitId) {
    const options = generateOptions(`${organization}/${project}/_apis/sourceProviders/tfsgit/filecontents?&repository=${repoId}&commitOrBranch=${commitId}&path=${filePath}&api-version=7.0`);
    const headers = options.headers;
    const response = await axios.get(options.hostname, { headers });

    return response.data;
}
async function resetCommit(commitHash, branchName, rollOut) {
    const payload = {
        source: {
            commitList: [{
                commitId: commitHash
            }]
        },
        ontoRefName: 'refs/heads/' + branchName,
        generatedRefName: "refs/heads/revert" + '-' + branchName,
        repository: {
            "id": repoId,
            "project": {
                "name": project,
            }
        }
    };
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/reverts?api-version=7.0`);
    const headers = options.headers;
    axios.post(options.hostname, payload, { headers }).then(response => {
        setTimeout(() => {
            createPullRequest(response.data.parameters.generatedRefName, response.data.parameters.ontoRefName, branchName, rollOut);
        }, 3000);

    }).catch(error => {
        console.error(error);
    });
}
async function createPullRequest(generatedRefName, ontoRefName, branchName, rollOut) {
    const payload = {
        sourceRefName: generatedRefName,
        targetRefName: ontoRefName,
        title: "Revert-" + branchName,
        description: "Revert-" + branchName,
        // reviewers: [{
        //     'id': '8083f3a0-fe7b-6dac-8b82-0237e4695ac4'
        // }]
    };
    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/pullrequests?api-version=7.0`);
    const headers = options.headers;
    axios.post(options.hostname, payload, { headers }).then(response => {
        setTimeout(async () => {
            comletePullRequest(response.data.pullRequestId, response.data.lastMergeSourceCommit.commitId, rollOut);
        }, 3000);
    }).catch(error => {
        console.error(error);
    });
}
function comletePullRequest(pullRequestId, lastMergeSourceCommit, rollOut) {
    const payload = {
        lastMergeSourceCommit: {
            commitId: lastMergeSourceCommit
        },
        status: "completed",
        completionOptions: {
            bypassPolicy: "true",
            bypassReason: "Automated update of Utils.dacpac",
            deleteSourceBranch: "true",
            mergeCommitMessage: "Rollback Rollout-" + rollOut,
            mergeStrategy: "noFastForward",
        }
    };

    const options = generateOptions(`${organization}/${project}/_apis/git/repositories/${repoId}/pullrequests/${pullRequestId}?api-version=7.0`);
    const headers = options.headers;
    axios.patch(options.hostname, payload, { headers }).then(async response => {
        console.log(response.data);
    }).catch(error => {
        console.error(error);
    });
}

module.exports = { getBranchesList, getAllCommit, getAllFile, getItemContent, resetCommit }