const { createNewFile, createSubFolders } = require('./createFiles')
const archiver = require('archiver');
const Client = require('ssh2-sftp-client');
const { NodeSSH } = require('node-ssh');
const { getItemContent, resetCommit } = require('./wmsService');
let fs = require('fs');
let nodemailer = require('nodemailer');
require('dotenv').config();
const {queryPromise} = require('../config');
const LESDIR = process.env.LESDIR;
const REFSDIR = process.env.REFSDIR;

async function createPackage(path, changedFiles, rollOutNumber, shaKey) {
    let scriptFile = [];
    let mbuild = 0;
    let loadrefdata = 0;
    let serverPathPrefix = '';
    scriptFile.push("# Extension ", rollOutNumber, "\n#\n# This script has been built automatically using RolloutBuilder.\n", "# Please check the actions taken by the script as they may not be entirely correct.\n", "# Also check the order of the actions taken if any dependencies might be\n", "# encountered\n", "#\n", "# Replacing files affected by extension.");
    scriptFile.push("\n\n")
    if (changedFiles.length > 0) {
        for (const file of changedFiles) {
            let secondSlashIndex = file.item.path.indexOf('/', file.item.path.indexOf('/') + 1);
            serverPathPrefix = file.item.path.substring(1, secondSlashIndex);

            if (!file.item?.isFolder) {
                let filePath = file.item.path;
                let lastSlashIndex = filePath.lastIndexOf('/');
                let fileName = filePath.substring(lastSlashIndex + 1);
                let secondSlashIndex = filePath.indexOf('/', filePath.indexOf('/') + 1);
                let folderPath = filePath.substring(secondSlashIndex + 1, lastSlashIndex);
                let fileNewPath = filePath.replace(/\/LES|\/RPWEB/g, 'pkg');

                if (!fileName.startsWith('UNINSTALL_')) {
                    const content = await getItemContent(filePath, shaKey);
                    await createNewFile(path, content, fileNewPath);
                    scriptFile.push("REPLACE ", fileNewPath, " ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath, "\n");

                    if (fileName.match(/\.(mcmd|mtrg|json|resource|action|jrxml)$/i)) {
                        mbuild++;
                    }
                    if (fileName.match(/\.(yaml)$/i)) {
                        loadrefdata++;
                    }
                }
            }
        }

        scriptFile.push("\n# Removing files removed by extension.\n", "\n", "\n# Run any SQL, MSQL, and other scripts.\n", generateProcessingScript(changedFiles, 'ins'), "\n", "\n# Load any data affected.  NOTE the assumption is that.\n", generateLoadDataScript(changedFiles, 'ins'), "\n", "\n# Import any Integrator data affected.\n", generateImportDataScript(changedFiles));
    }
    scriptFile.push("\n", "\n# Rebuilding C makefiles if necessary.\n", "\n# Perform any environment rebuilds if necessary.", "\n#ANT")
    if (mbuild > 0) {
        scriptFile.push("\nMBUILD\n")
    } else if (loadrefdata > 0) {
        scriptFile.push("\n#MBUILD")
        scriptFile.push("\nLoadREFSData\n")
    }
    scriptFile.push("\n# END OF AUTO-GENERATED SCRIPT.\n");
    const html = scriptFile.join("");

    fs.writeFile(path + "/" + rollOutNumber, html, function (err) {
        if (err) throw err;
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
    return serverPathPrefix;
}
async function makeUninstallDir(params) {
    let { req, path, changedFiles, rollOut, shaKey, siteId, envId } = params;
    let pathDir = path + '/UNINSTALL_' + rollOut;
    fs.access(pathDir, async (error) => {
        if (error) {
            fs.mkdir(pathDir, async (error) => {
                if (error) {
                    return error;
                } else {
                    await buildUninstallPackage({ req, pathDir, changedFiles, rollOut, shaKey, siteId, envId, path })
                }
            })
        }
        else {
            await buildUninstallPackage({ req, pathDir, changedFiles, rollOut, shaKey, siteId, envId, path });
        }
    });
}
async function buildUninstallPackage(params) {
    let { req, pathDir, changedFiles, rollOut, shaKey, siteId, envId, path } = params;
    const server = await queryPromise(siteId, envId);
    if (server) {
        let scriptFile = [];
        let mbuild = 0;
        let loadrefsdata = 0;
        let mainDir = '';
        scriptFile.push("# Extension ", 'UNINSTALL_' + rollOut, "\n#\n# This script has been built automatically using RolloutBuilder.\n", "# Please check the actions taken by the script as they may not be entirely correct.\n", "# Also check the order of the actions taken if any dependencies might be\n", "# encountered\n", "#\n", "# Replacing files affected by extension.");
        scriptFile.push("\n\n")
        if (changedFiles.length > 0) {
            for (const file of changedFiles) {
                let secondSlashIndex = file.item.path.indexOf('/', file.item.path.indexOf('/') + 1);
                mainDir = file.item.path.substring(1, secondSlashIndex);

                if (!file.item?.isFolder) {
                    let filePath = file.item.path;
                    let lastSlashIndex = filePath.lastIndexOf('/');
                    let fileName = filePath.substring(lastSlashIndex + 1);
                    let secondSlashIndex = filePath.indexOf('/', filePath.indexOf('/') + 1);
                    let folderPath = filePath.substring(secondSlashIndex + 1, lastSlashIndex);
                    let fileNewPath = filePath.replace(/\/LES|\/RPWEB/g, 'pkg');

                    if (fileName.startsWith('UNINSTALL_')) {
                        const content = await getItemContent(filePath, shaKey);
                        await createNewFile(pathDir, content, fileNewPath);
                        scriptFile.push("REPLACE ", fileNewPath, " ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath, "\n");
                    }
                    else {
                        if (fileName.match(/\.(ctl)$/i)) {
                            const content = await getItemContent(filePath, shaKey);
                            await createNewFile(pathDir, content, fileNewPath);
                            scriptFile.push("REPLACE ", fileNewPath, " ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath, "\n");
                        }
                        if (fileName.match(/\.(mcmd|mtrg|json|resource|action|jrxml|yaml)$/i)) {
                            let sftp = new Client();
                            let isAvailable = false;
                            await sftp.connect({
                                host: server[0].Host,
                                port: server[0].Port,
                                username: server[0].Username,
                                password: server[0].Password
                            }).then(() => {
                                return sftp.get('Prod' + filePath);
                            }).then(res => {
                                createSubFolders(fileNewPath, pathDir);
                                sftp.get('Prod' + filePath, pathDir + '/' + fileNewPath);
                                isAvailable = true;
                                scriptFile.push("REPLACE ", fileNewPath, " ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath, "\n");
                            }).catch(err => {
                                if (!isAvailable) {
                                    scriptFile.push("REMOVE ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath + '/' + fileName, "\n");
                                }
                            });
                            fileName.match(/\.(yaml)$/i) ? loadrefsdata++ : mbuild++;
                        }
                    }
                }
            }
            scriptFile.push("\n# Removing files removed by extension.\n", "\n", "\n# Run any SQL, MSQL, and other scripts.\n", generateProcessingScript(changedFiles, 'uni'), "\n", "\n# Load any data affected.  NOTE the assumption is that.\n", generateLoadDataScript(changedFiles, 'uni'), "\n", "\n# Import any Integrator data affected.\n", generateImportDataScript(changedFiles));
        }
        scriptFile.push("\n", "\n# Rebuilding C makefiles if necessary.\n", "\n# Perform any environment rebuilds if necessary.", "\n#ANT")
        if (mbuild > 0) {
            scriptFile.push("\nMBUILD\n")
        } else if (loadrefsdata > 0) {
            scriptFile.push("\n#MBUILD")
            scriptFile.push("\nLoadREFSData\n")
        }
        scriptFile.push("\n# END OF AUTO-GENERATED SCRIPT.\n");
        const html = scriptFile.join("");

        fs.writeFile(pathDir + "/UNINSTALL_" + rollOut, html, function (err) {
            if (err) return err;
            fs.readdir('common/', async (error, files) => {
                if (error) return error;
                files.forEach(file => {
                    fs.copyFile('common/' + file, pathDir + '/' + file, (err) => {
                        if (err) return err;
                    });
                });
                let serverPath = '\\hotfixes\\' + rollOut;
                await generateZipDir(path, path + ".zip");
                setTimeout(async () => {
                    await deployScript({ req, path, mainDir, serverPath, siteId, envId, rollOut });
                }, 10000);

            });
        });

    }
}
function generateProcessingScript(changedFiles, rolloutType) {
    let scriptFile = []
    for (const file of changedFiles) {
        if (!file.item.isFolder) {
            let filePath = file.item.path;
            let offset = filePath.lastIndexOf('/')
            let fileName = filePath.substring(offset + 1);
            let fileNewPath = filePath.replace(/\/LES|\/RPWEB/g, 'pkg');
            if ((!fileName.includes('UNINSTALL_') && rolloutType === 'ins') || (fileName.includes('UNINSTALL_') && rolloutType === 'uni')) {
                if (fileName.match(/\.(sql|tbl|idx|trg|hdr|prc|pck|seq)$/i)) {
                    scriptFile.push("RUNSQL ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + fileNewPath, "\n");
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
            let lastSlashIndex = filePath.lastIndexOf('/')
            let fileName = filePath.substring(lastSlashIndex + 1);
            let secondSlashIndex = filePath.indexOf('/', filePath.indexOf('/') + 1);
            let folderPath = filePath.substring(secondSlashIndex + 1, lastSlashIndex);
            let fileNewPath = filePath.replace(/\/LES|\/RPWEB/g, 'pkg');
            if (fileName.match(/\.(csv)$/i)) {
                if (!fileName.includes('UNINSTALL_') && rollType === 'ins') {
                    let offset = fileName.indexOf('-');
                    if (offset > 0) {
                        let filePrefix = fileName.substring(0, offset);
                        scriptFile.push("LOADDATA ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                    else {
                        let offset = fileName.indexOf('.');
                        let filePrefix = fileName.substring(0, offset);
                        scriptFile.push("LOADDATA ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                }
                else if (fileName.includes('UNINSTALL_') && rollType === 'uni') {
                    let offset1 = fileName.indexOf('_');
                    let offset = fileName.indexOf('-');
                    if (offset > 0) {
                        let filePrefix = fileName.substring(offset1 + 1, offset);
                        scriptFile.push("LOADDATA ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
                    }
                    else {
                        let offset = fileName.indexOf('.');
                        let filePrefix = fileName.substring(offset1 + 1, offset);
                        scriptFile.push("LOADDATA ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + folderPath + "/" + filePrefix + ".ctl", " ", fileNewPath, "\n");
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
            let fileNewPath = filePath.replace(/\/LES|\/RPWEB/g, 'pkg');
            if (!fileName.includes('UNINSTALL_') || fileName.includes('UNINSTALL_')) {
                if (fileName.match(/\.(slexp)$/i)) {
                    scriptFile.push("IMPORTSLDATA ", (filePath.startsWith('/LES') ? LESDIR : REFSDIR) + fileNewPath, "\n");
                }
            }
        }
    }
    const html = scriptFile.join("");
    return html;
}
async function generateZipDir(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return await new Promise(async (resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);
        stream.on('close', () => resolve());
        await archive.finalize();
    });
}
async function deployScript(params) {
    let alert = 'The Rollout has been deployed successfully';
    const { req, path, mainDir, serverPath, siteId, envId, rollOut } = params;

    const server = await queryPromise(siteId, envId);
    if (server) {
        let envPath = '';
        let envPath1 = '';
        if (envId == 2) {
            envPath = 'Prod/';
            envPath1 = 'Prod\\';
        }
        let sftp = new Client();
        if (server.length > 0) {
            sftp.connect({
                host: server[0].Host,
                port: server[0].Port,
                username: server[0].Username,
                password: server[0].Password
            }).then(async () => {
                return await sftp.put(path + ".zip", envPath + mainDir + '/hotfixes/' + rollOut + ".zip");
            }).then(async data => {
                const ssh = new NodeSSH()
                let serverPathNew = envPath1 + mainDir + serverPath;
                let cmds = [
                    "mkdir " + serverPathNew,
                    "tar -xf " + serverPathNew + ".zip -C " + serverPathNew,
                    envPath1 + "LES\\data\\env",
                    //"perl "+serverPathNew+"\\rollout.pl " + rollOut,
                    "perl " + serverPathNew + "\\script.pl"
                ];

                ssh.connect({
                    host: server[0].Host,
                    username: server[0].Username,
                    password: server[0].Password
                }).then(function () {
                    cmds.forEach(command => {
                        setTimeout(async () => {
                            ssh.execCommand(command).then(function (result) {
                                if (result.stderr) {
                                    console.log(result.stderr)
                                    getToastAlert(req, 'error', result.stderr);
                                }
                                else if (result.stdout) {
                                    console.log({ result: result.stdout })
                                    getToastAlert(req, 'success', 'The rollout has been deployed successfully.');
                                }
                            });
                        }, 5000);
                    });

                }).catch(err => {
                    getToastAlert(req, 'error', err);
                });
                getToastAlert(req, 'info', data);
                getToastAlert(req, 'success', 'The rollout has been deployed successfully.');
            }).catch(err => {
                getToastAlert(req, 'error', err);
            });
        } else {
            alert = "SFTP details does not exists for this site.";
        }
    }
    return alert;
}
async function executeUninstall(params) {
    const { req, serverPath, siteId, envId, environment, commitId, branch, rollOut } = params;
    const server = await queryPromise(siteId, envId);
    if (server) {
        let envPath = '';
        if (envId == 2) {
            envPath = 'Prod\\';
        }
        const ssh = new NodeSSH()
        let cmds = [
            envPath + "LESS\\data\\env",
            //"perl " + serverPath + "\\rollout.pl " + rollOut,
            "perl " + serverPath + "\\script.pl"
        ];
        ssh.connect({
            host: server[0].Host,
            username: server[0].Username,
            password: server[0].Password
        }).then(async function () {
            cmds.forEach(command => {
                ssh.execCommand(command).then(async function (result) {
                    if (result.stderr) {
                        console.log(result.stderr)
                        getToastAlert(req, 'error', result.stderr);
                    }
                    else if (result.stdout) {
                        if (command.startsWith('perl')) {
                            console.log(result.stdout)
                        }
                        await resetCommit(commitId, branch, rollOut);
                        getToastAlert(req, 'success', "The rollout has been uninstall successfully from " + environment + ".");
                    }
                })
            });
        })
        return "The rollout has been uninstall successfully from " + environment + ".";
    }
    else {
        return "The rollout is not uninstall from " + environment + ".";
    }

}
function getToastAlert(req, type, message) {
    if (type === 'error') {
        req.toastr.error(message, '', { positionClass: 'toast-bottom-right' });
    }
    else if (type === 'info') {
        req.toastr.info(message, '', { positionClass: 'toast-bottom-right' });
    }
    else {
        req.toastr.success(message, '', { positionClass: 'toast-bottom-right' });
    }
}
function SendEmail(mailOptions) {
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
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