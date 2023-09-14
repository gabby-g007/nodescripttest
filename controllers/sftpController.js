const { getEnvironments } = require('../services/environmentService');
const { getSftpCredentials, setSFTPDetail, removeSFTPDetail, editSFTP } = require('../services/sftpService');
const { getSites } = require('../services/siteService');

async function getAllCredentials(req, res) {
    const sftpCreds = await getSftpCredentials();
    const sitesList = await getSites();
    const envList = await getEnvironments();
    res.render('admin/sftpCredential', { sftpCreds: sftpCreds, siteList: sitesList, envList: envList, req: req });
}
async function createSFTP(req, res) {
    let sftpDetail = {
        siteId: req.body.site,
        envId: req.body.environment,
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        password: req.body.password,
    }
    await setSFTPDetail(sftpDetail);
    const sftpCreds = await getSftpCredentials();
    res.json(sftpCreds)
    //res.render('admin/sftpCredential', { sftpCreds: sftpCreds, siteList: sitesList, req: req });
}
async function deleteSFTPDetail(req, res) {
    await removeSFTPDetail(req.body.id);
    const sftpCreds = await getSftpCredentials();
    res.json(sftpCreds)
    //res.render('admin/sftpCredential', { sftpCreds: sftpCreds, siteList: sitesList, req: req });
}
async function updateSFTP(req, res) {
    let sftpDetail = {
        id: req.body.id,
        siteId: req.body.site,
        envId: req.body.environment,
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        password: req.body.password,
    }
    const resp = await editSFTP(sftpDetail);
    res.json(resp);
}
module.exports = { getAllCredentials, createSFTP, deleteSFTPDetail, updateSFTP }