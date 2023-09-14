const { getSites, insertSite, removeSite, editSite } = require('../services/siteService');

async function getAllSites(req, res) {
    const sitesList = await getSites();
    res.render('admin/manageSite', { sitesList: sitesList, req: req });
}
//createSite
async function createSite(req, res) {
    let siteName = req.body.sitename;
    const response = await insertSite(siteName);
    res.json(response);
    //res.render('admin/manageSite', { sitesList: sitesList, req: req });
}
async function deleteSite(req,res){
    let siteId = req.body.id;
    const response = await removeSite(siteId);
    res.json(response);
}
//updateSite
async function updateSite(req, res) {
    let siteId = req.body.id;
    let siteName = req.body.sitename;
    const response = await editSite(siteId,siteName);
    res.json(response);
    //res.render('admin/manageSite', { sitesList: sitesList, req: req });
}
module.exports = { getAllSites, createSite, deleteSite, updateSite }