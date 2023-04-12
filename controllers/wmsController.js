var fs = require('fs');
const sql = require("msnodesqlv8");
const moment = require('moment');
const { createPackage, makeUninstallDir, generateZipDir, deployScript, executeUninstall, getToastAlert } = require('../services/createRollout')
const { getBranchesList, getAllFile, getAllCommit, deployRollout } = require('../services/wmsService');

const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

let branch = '';
let shaKey = '';
let rollOut = '';

async function getBranchesLists(req, res) {
    const branchList = await getBranchesList();
    res.render('pages/home', { response: branchList, req: req });
}
async function getAllCommits(req, res) {
    let branch = req.query.branch;
    const commits = await getAllCommit(branch);
    res.render('pages/commits', { respCommit: commits, moment: moment });
}
async function getAllFiles(req, res) {
    shaKey = req.query.sha
    rollOut = req.query.commit;
    let offset = rollOut.indexOf('_')
    if (offset > 0) {
        rollOut = rollOut.substring(offset + 1, rollOut.length)
    }
    const allFiles = await getAllFile(shaKey);
    res.render('pages/files', { changedFiles: allFiles, message: '' });
}
async function createRollout(req, res) {
    const changedFiles = await getAllFile(shaKey)
    let siteId = 1;
    let envId = 1;
    //const query = "select top 1 rollout_name from rollout_master where rollout_name='" + rollOut + "'";
    //sql.query(connectionString, query, (err, rows) => {
    //if (rows.length <= 0) {
    // const rolloutQuery = "insert into rollout_master (rollout_name) values('" + rollOut + "')";
    //sql.query(connectionString, rolloutQuery, (err, response) => {
    //   if (err) return err;
    let path = 'hotfixes/' + rollOut;
    fs.access(path, async (error) => {
        if (error) {
            fs.mkdir(path, async (error) => {
                if (error) {
                    return error;
                } else {
                    createPackage(path, changedFiles, rollOut, shaKey);
                    makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString)
                }
            })
        }
        else {
            createPackage(path, changedFiles, rollOut, shaKey);
            makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString);
        }
    });

    getToastAlert(req, 'success', "The rollout has been created.");
    const query = "select site_id as id,site_name as name from site_master";
    sql.query(connectionString, query, async (err, siteList) => {
        if (err) return err;
        res.render('pages/deployRollout', { siteList: siteList, req: req });
    });

    //});
    // }
    // else {
    //     getToastAlert(req, 'success', "The rollout is already created.");
    //     const query = "select site_id as id,site_name as name from site_master";
    //     sql.query(connectionString, query, (err, siteList) => {
    //         if (err) return err;
    //         res.render('pages/deployRollout', { siteList: siteList, req: req });
    //     });
    // }
    //});
}
async function deployToProduction(req, res) {
    let siteId = req.body.site;
    let envId = req.body.environment;
    let execType = req.query.button;
    //zip the folder to the server 
    let path = 'hotfixes/' + rollOut;
    let serverPath = 'LES\\hotfixes\\' + rollOut;
    generateZipDir(path, path + ".zip")
    if (execType === 'uni') {
        serverPath = 'LES\\hotfixes\\' + rollOut + '\\UNINSTALL_' + rollOut;

    }
    deployScript(req, path, serverPath, siteId, envId, rollOut, connectionString, execType);
    const branchList = await getBranchesList()
    res.render('pages/home', { response: branchList, req: req });
}
function getEnvBySite(req, res) {
    const query = "SELECT [site_env_envid] as id, [env_name] as [name]  FROM [dbo].[site_env_mapping],env_master where site_env_siteid=" + req.params.id + " and env_id=site_env_envid";
    sql.query(connectionString, query, (err, rows) => {
        res.json(rows);
    });
}
async function rolloutScript(req, res) {
    let branch = req.body.branch;
    let siteId = req.body.siteId;
    let envId = req.body.envId;
    let excType = 'ins'; /* 'ins' goes to INSTALL/ROLLOUT */
    const response1 = await getAllCommit(branch);
    shaKey = response1[0].commitId
    rollOut = response1[0].comment;
    if (rollOut.startsWith('COV')) {
        console.log({rollOut})
        let offset = rollOut.indexOf('_')
        if (offset > 0) {
            rollOut = rollOut.substring(offset + 1, rollOut.length);
            /* execute on UNINSTALL Rollout */
            excType = 'uni'; /* 'uni' goes to UNINSTALL/ROLLBACK */
        }
        else {
            /* execute on INSTALL Rollout */
            excType = 'ins'; /* 'ins' goes to INSTALL/ROLLOUT */
        }
        const changedFiles = await getAllFile(shaKey);
        let path = 'hotfixes/' + rollOut;
        let serverPath = 'LES\\hotfixes\\' + rollOut;
        fs.access(path, (error) => {
            if (error) {
                fs.mkdir(path, (error) => {
                    if (error) {
                        return error;
                    } else {
                        if (excType === 'uni') {
                            makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString);
                        }
                        else {
                            createPackage(path, changedFiles, rollOut, shaKey);
                            makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString);
                        }
                    }
                })
            }
            else {
                if (excType === 'uni') {
                    makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString);
                }
                else {
                    createPackage(path, changedFiles, rollOut, shaKey);
                    makeUninstallDir(path, changedFiles, rollOut, shaKey, siteId, envId, connectionString);
                }
            }
        });

        // setTimeout(() => {
            res.json(deployRollout(req, path, serverPath, siteId, envId, rollOut, excType));
        // }, 3000);
        
    }
    else
    {
        res.json("Rollout name format is not valid. so you cann't create rollout.")
    }
}
async function uninstallRollout(req, res) {
    let rollOut = req.body.rollout;
    let siteId = req.body.siteId;
    let envId = req.body.envId;
    let branch = req.body.branch;
    const response1 = await getAllCommit(branch);
    shaKey = response1[0].commitId;
    let envPath = '';
    let environment = 'QA Server';
    if (envId == 2) {
        envPath = 'Prod\\';
        environment = 'Production';
    }
    let path = 'hotfixes/' + rollOut + '/UNINSTALL_' + rollOut;
    let serverPath = envPath + 'LES\\hotfixes\\' + rollOut + '\\UNINSTALL_' + rollOut;

    fs.readdir(path, async (err, files) => {
        if (err) {
            res.json("The rollout name does not exists at " + environment + ".");
        }
        else {
            let resp = await executeUninstall(req, serverPath, siteId, envId, connectionString, environment, shaKey, branch, rollOut);
            res.json(resp);
        }
    })

}
async function productionRollout(req, res) {
    let siteId = req.body.siteId;
    let envId = req.body.envId;
    let rolloutName = req.body.rollout;
    let path = 'hotfixes/' + rolloutName;
    let serverPath = 'Prod\\LES\\hotfixes\\' + rolloutName;
    fs.readdir(path, (err, files) => {
        if (err) {
            res.json('The rollout name does not exists at QA Server.');
        }
        else {
            let resp = deployScript(req, path, serverPath, siteId, envId, rolloutName, connectionString, 'ins');
            res.json('The rollout has been deployed successfully.');
        }
    })

}
module.exports = { getBranchesLists, getAllCommits, getAllFiles, createRollout,deployToProduction, getEnvBySite, rolloutScript, uninstallRollout, productionRollout }