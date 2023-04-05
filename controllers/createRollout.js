const { createNewFile, createSubFolders } = require('./createFiles')
const archiver = require('archiver');
const Client = require('ssh2-sftp-client');
const { NodeSSH } = require('node-ssh');
const { getItemContent } = require('./controllers');
var fs = require('fs');
const sql = require("msnodesqlv8");
var nodemailer = require('nodemailer');
require('dotenv').config();

async function createPackage(path, changedFiles, rollOutNumber, shaKey) {
    var scriptFile = [];
    let mbuild = 0;
    scriptFile.push("# Extension ", rollOutNumber, "\n#\n# This script has been built automatically using RolloutBuilder.\n", "# Please check the actions taken by the script as they may not be entirely correct.\n", "# Also check the order of the actions taken if any dependencies might be\n", "# encountered\n", "#\n", "# Replacing files affected by extension.\n");
    scriptFile.push("\n\n")
    if (changedFiles.length > 0) {
        for (const file of changedFiles) {
            if (!file.item?.isFolder) {
                let filePath = file.item.path;
                let offset = filePath.lastIndexOf('/');
                let fileName = filePath.substring(offset + 1);
                let folderPath = filePath.substring(0, offset);
                if (folderPath.includes('LES')) {
                    folderPath = folderPath.slice(4, folderPath.length);
                }
                let fileNewPath = filePath.replace('/LES', 'pkg');
                if (!fileName.includes('UNINSTALL_')) {
                    const content = await getItemContent(filePath, shaKey);
                    const newFile = await createNewFile(path, content, fileNewPath);
                    scriptFile.push("REPLACE ", fileNewPath, " ", "$LESDIR/" + folderPath, "\n");
                    if (fileName.match(/\.(mcmd|mtrg|json|resource|action|jrxml)$/i)) {
                        mbuild++;
                    }
                }
            }
        }

        scriptFile.push("\n# Removing files removed by extension.\n", "\n", "\n# Run any SQL, MSQL, and other scripts.\n", generateProcessingScript(changedFiles, 'ins'), "\n", "\n# Load any data affected.  NOTE the assumption is that.\n", generateLoadDataScript(changedFiles, 'ins'), "\n", "\n# Import any Integrator data affected.\n", generateImportDataScript(changedFiles));
    }
    scriptFile.push("\n", "\n# Rebuilding C makefiles if necessary.\n", "\n# Perform any environment rebuilds if necessary.", "\n#ANT\n")
    if (mbuild > 0) {
        scriptFile.push("\nMBUILD\n")
    }
    scriptFile.push("\n# END OF AUTO-GENERATED SCRIPT.\n");
    const html = scriptFile.join("");

    fs.writeFile(path + "/" + rollOutNumber, html, function (err) {
        if (err) throw err;
        let msg = 'File is created successfully.';
    });
    fs.readdir('common/', (error, files) => {
        if (error) throw error;
        const directoriesInDIrectory = files;
        directoriesInDIrectory.forEach(file => {
            fs.copyFile('common/' + file, path + '/' + file, (err) => {
                if (err) return err;
            });
        })
    });
}
async function makeUninstallDir(path, changedFiles, rollOutNumber, shaKey, siteId, envId, connectionString) {
    path += '/UNINSTALL_' + rollOutNumber;
    fs.access(path, async (error) => {
        if (error) {
            fs.mkdir(path, async (error) => {
                if (error) {
                    return error;
                } else {
                    await buildUninstallPackage(path, changedFiles, rollOutNumber, shaKey, siteId, envId, connectionString)
                }
            })
        }
        else {
            await buildUninstallPackage(path, changedFiles, rollOutNumber, shaKey, siteId, envId, connectionString);
        }
    });

}
async function buildUninstallPackage(path, changedFiles, rollOutNumber, shaKey, siteId, envId, connectionString) {
    const query = "SELECT [site_env_host] as Host ,[site_env_port] as [Port] ,[site_env_username] as Username,[site_env_password] as [Password] FROM [dbo].[site_env_mapping] where site_env_siteid=" + siteId + " and site_env_envid=" + envId;
    sql.query(connectionString, query, async (err, server) => {
        if (err) return err;
        var scriptFile = [];
        let mbuild = 0;
        scriptFile.push("# Extension ", rollOutNumber, "\n#\n# This script has been built automatically using RolloutBuilder.\n", "# Please check the actions taken by the script as they may not be entirely correct.\n", "# Also check the order of the actions taken if any dependencies might be\n", "# encountered\n", "#\n", "# Replacing files affected by extension.\n");
        scriptFile.push("\n\n")
        if (changedFiles.length > 0) {
            for (const file of changedFiles) {
                if (!file.item?.isFolder) {
                    let filePath = file.item.path;
                    let offset = filePath.lastIndexOf('/');
                    let fileName = filePath.substring(offset + 1);
                    let folderPath = filePath.substring(0, offset);
                    if (folderPath.includes('LES')) {
                        folderPath = folderPath.slice(4, folderPath.length);
                    }
                    let fileNewPath = filePath.replace('/LES', 'pkg');
                    if (fileName.includes('UNINSTALL_')) {
                        const content = await getItemContent(filePath, shaKey);
                        const newFile = await createNewFile(path, content, fileNewPath);
                        scriptFile.push("REPLACE ", fileNewPath, " ", "$LESDIR/" + folderPath, "\n");
                    }
                    else {
                        if (fileName.match(/\.(ctl)$/i)) {
                            const content = await getItemContent(filePath, shaKey);
                            const newFile = await createNewFile(path, content, filePath);
                            scriptFile.push("REPLACE ", fileNewPath, " ", "$LESDIR/" + folderPath, "\n");
                        }
                        if (fileName.match(/\.(mcmd|mtrg|json|resource|action|jrxml)$/i)) {
                            let sftp = new Client();
                            let isAvailable = false;
                            await sftp.connect({
                                host: server[0].Host,
                                port: server[0].Port,
                                username: server[0].Username,
                                password: server[0].Password
                            }).then(() => {
                                return sftp.get(filePath);
                            }).then(res => {
                                createSubFolders(fileNewPath, path);
                                sftp.get(filePath, path + '/' + fileNewPath);
                                isAvailable = true;
                                scriptFile.push("REPLACE ", fileNewPath, " ", "$LESDIR/" + folderPath, "\n");
                            }).catch(err => {
                                if (!isAvailable) {
                                    scriptFile.push("REMOVE ", "$LESDIR/" + folderPath + filePath, "\n");
                                }
                            });
                            mbuild++;


                        }
                    }
                }
            }
            scriptFile.push("\n# Removing files removed by extension.\n", "\n", "\n# Run any SQL, MSQL, and other scripts.\n", generateProcessingScript(changedFiles, 'uni'), "\n", "\n# Load any data affected.  NOTE the assumption is that.\n", generateLoadDataScript(changedFiles, 'uni'), "\n", "\n# Import any Integrator data affected.\n", generateImportDataScript(changedFiles));
        }
        scriptFile.push("\n", "\n# Rebuilding C makefiles if necessary.\n", "\n# Perform any environment rebuilds if necessary.", "\n#ANT\n")
        if (mbuild > 0) {
            scriptFile.push("\nMBUILD\n")
        }
        scriptFile.push("\n# END OF AUTO-GENERATED SCRIPT.\n");
        const html = scriptFile.join("");

        fs.writeFile(path + "/UNINSTALL_" + rollOutNumber, html, function (err) {
            if (err) return err;
            let msg = 'File is created successfully.';
        });
        fs.readdir('common/', (error, files) => {
            if (error) return error;
            const directoriesInDIrectory = files;
            directoriesInDIrectory.forEach(file => {
                fs.copyFile('common/' + file, path + '/' + file, (err) => {
                    if (err) return err;
                });
            })
        });
    })
}
function generateProcessingScript(changedFiles, rolloutType) {
    let scriptFile = []
    for (const file of changedFiles) {
        if (!file.item.isFolder) {
            let filePath = file.item.path;
            let offset = filePath.lastIndexOf('/')
            let fileName = filePath.substring(offset + 1);
            let fileNewPath = filePath.replace('/LES', 'pkg');
            if (!fileName.includes('UNINSTALL_') && rolloutType === 'ins') {
                if (fileName.match(/\.(sql|tbl|idx|trg|hdr|prc|pck|seq)$/i)) {
                    scriptFile.push("RUNSQL ", "$LESDIR/" + fileNewPath, "\n");
                }
            } else if (fileName.includes('UNINSTALL_') && rolloutType === 'uni') {
                if (fileName.match(/\.(sql|tbl|idx|trg|hdr|prc|pck|seq)$/i)) {
                    scriptFile.push("RUNSQL ", "$LESDIR/" + fileNewPath, "\n");
                }
            }
        }
    }
    const html = scriptFile.join("");
    return html;
}
function generateLoadDataScript(changedFiles, rollType) {
    let scriptFile = []
    for (const file of changedFiles) {
        if (!file.item.isFolder) {
            let filePath = file.item.path;
            let offset = filePath.lastIndexOf('/')
            let fileName = filePath.substring(offset + 1);
            let folderPath = filePath.substring(0, offset);
            if (folderPath.includes('LES')) {
                folderPath = folderPath.slice(4, folderPath.length);
            }
            let fileNewPath = filePath.replace('/LES', '$LESDIR');
            if (fileName.match(/\.(csv)$/i)) {
                if (!fileName.includes('UNINSTALL_') && rollType === 'ins') {
                    let offset = fileName.indexOf('-');
                    if (offset > 0) {
                        let filePrefix = fileName.substring(0, offset);
                        scriptFile.push("LOADDATA ", '$LESDIR/' + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                    else {
                        let offset = fileName.indexOf('.');
                        let filePrefix = fileName.substring(0, offset);
                        scriptFile.push("LOADDATA ", '$LESDIR/' + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                }
                else if (fileName.includes('UNINSTALL_') && rollType === 'uni') {
                    let offset1 = fileName.indexOf('_');
                    let offset = fileName.indexOf('-');
                    if (offset > 0) {
                        let filePrefix = fileName.substring(offset1 + 1, offset);
                        scriptFile.push("LOADDATA ", '$LESDIR/' + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                    else {
                        let offset = fileName.indexOf('.');
                        let filePrefix = fileName.substring(offset1 + 1, offset);
                        scriptFile.push("LOADDATA ", '$LESDIR/' + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                }

            }
        }
    }
    const html = scriptFile.join("");
    return html;
}
function generateImportDataScript(changedFiles) {
    let scriptFile = []
    for (const file of changedFiles) {
        if (!file.item.isFolder) {
            let filePath = file.item.path;
            let offset = filePath.lastIndexOf('/')
            let fileName = filePath.substring(offset + 1);
            let fileNewPath = filePath.replace('/LES', 'pkg');
            if (!fileName.includes('UNINSTALL_')) {
                if (fileName.match(/\.(slexp)$/i)) {
                    scriptFile.push("IMPORTSLDATA ", "$LESDIR/" + fileNewPath, "\n");
                }
            }
            else if (fileName.includes('UNINSTALL_')) {
                if (fileName.match(/\.(slexp)$/i)) {
                    scriptFile.push("IMPORTSLDATA ", "$LESDIR/" + fileNewPath, "\n");
                }
            }
        }
    }
    const html = scriptFile.join("");
    return html;
}
function generateZipDir(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);
        stream.on('close', () => resolve());
        archive.finalize();
    });
}
async function deployScript(req, path, serverPath, siteId, envId, rollOut, connectionString, rollType) {
    generateZipDir(path, path + ".zip");
    const query = "SELECT [site_env_host] as Host ,[site_env_port] as [Port] ,[site_env_username] as Username,[site_env_password] as [Password] FROM [dbo].[site_env_mapping] where site_env_siteid=" + siteId + " and site_env_envid=" + envId;
    sql.query(connectionString, query, (err, server) => {
        if (err) return err;
        let envPath = '';
        let envPath1 = '';
        if (envId == 2) {
            envPath = 'Prod/';
            envPath1 = 'Prod\\';
        }
        let sftp = new Client();
        var mailOptions = {
            from: 'appwork.clockdiary@gmail.com',
            to: 'gabby.g@appwrk.com',
            subject: 'Rollout Process Status'
        };
        if (server.length > 0) {
            sftp.connect({
                host: server[0].Host,
                port: server[0].Port,
                username: server[0].Username,
                password: server[0].Password
            }).then(() => {
                return sftp.put(path + ".zip", envPath + 'LES/hotfixes/' + rollOut + ".zip");
            }).then(data => {
                const ssh = new NodeSSH()

                var cmds = [
                    "mkdir " + serverPath,
                    "tar -xf " + serverPath + ".zip -C " + serverPath,
                    envPath1 + "LES\\data\\env",
                    //"perl "+serverPath+"\\rollout.pl " + rollOut,
                    "perl " + serverPath + "\\script.pl"
                ];
                if (rollType === 'uni') {
                    cmds = [
                        "tar -xf " + serverPath + ".zip -C " + serverPath,
                        envPath1 + "LES\\data\\env",
                        "perl " + serverPath + "\\script.pl"
                    ];
                }
                ssh.connect({
                    host: server[0].Host,
                    username: server[0].Username,
                    password: server[0].Password
                }).then(function () {
                    cmds.forEach(command => {
                        ssh.execCommand(command).then(function (result) {
                            if (result.stderr) {
                                getToastAlert(req, 'error', result.stderr);
                            }
                            else if (result.stdout) {
                                getToastAlert(req, 'success', 'The rollout has been deployed successfully.');
                            }
                        })
                    });

                }).catch(err => {
                    getToastAlert(req, 'error', err);
                });
                getToastAlert(req, 'info', data);
                getToastAlert(req, 'success', 'The rollout has been deployed successfully.');
                mailOptions.text = 'The rollout has been deployed successfully.'
                //SendEmail(mailOptions);
            }).catch(err => {
                mailOptions.text = 'Some internal error occured.'
                //SendEmail(mailOptions);
                getToastAlert(req, 'error', err);
            });
        } else {
            return "SFTP details does not exists for this site."
        }

    })
    return 'The rollout has been deployed successfully.';
}
function executeUninstall(req, serverPath, siteId, envId, connectionString, environment) {
    const query = "SELECT [site_env_host] as Host ,[site_env_port] as [Port] ,[site_env_username] as Username,[site_env_password] as [Password] FROM [dbo].[site_env_mapping] where site_env_siteid=" + siteId + " and site_env_envid=" + envId;

    sql.query(connectionString, query, (err, server) => {
        if (err) return err;
        let envPath = '';
        if (envId == 2) {
            envPath = 'Prod\\';
        }
        const ssh = new NodeSSH()
        var cmds = [
            envPath + "LES\\data\\env",
            //"perl "+serverPath+"\\rollout.pl " + rollOut,
            "perl " + serverPath + "\\script.pl"
        ];
        ssh.connect({
            host: server[0].Host,
            username: server[0].Username,
            password: server[0].Password
        }).then(function () {
            cmds.forEach(command => {
                ssh.execCommand(command).then(function (result) {
                    if (result.stderr) {
                        getToastAlert(req, 'error', result.stderr);
                        return result.stderr;
                    }
                    else if (result.stdout) {
                        getToastAlert(req, 'success', "The rollout has been uninstall successfully from " + environment + ".");
                        return result.stdout;
                    }
                })
            });
        })
    })
    return "The rollout has been uninstall successfully from " + environment + ".";

}
function getToastAlert(req, type, message) {
    if (type === 'error') {
        req.toastr.error(message, title = '', options = { positionClass: 'toast-bottom-right' });
    }
    else if (type === 'info') {
        req.toastr.info(message, title = '', options = { positionClass: 'toast-bottom-right' });
    }
    else {
        req.toastr.success(message, title = '', options = { positionClass: 'toast-bottom-right' });
    }
}
function SendEmail(mailOptions) {
    var transporter = nodemailer.createTransport({
        host: process.env.HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.USERNAME,
            pass: process.env.PASSWORD
        }
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return 'Some internal error occured.';
        } else {
            return info.response.includes('OK');
        }
    });
}

module.exports = { createPackage, makeUninstallDir, generateZipDir, deployScript, executeUninstall, getToastAlert }