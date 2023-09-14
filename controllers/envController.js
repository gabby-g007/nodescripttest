const { insertEnvironement, getEnvironments, removeEnvironment, editEnvironment } = require('../services/environmentService');

async function createEnvironement(req, res) {
    let envName = req.body.envname;
    let environmentList = await insertEnvironement(envName);
    res.json(environmentList);
    //res.render('admin/manageEnvironment', { environmentList: environmentList, req: req });
}

async function getAllEnvironments(req, res) {
    const environmentList = await getEnvironments();
    res.render('admin/manageEnvironment', {environmentList : environmentList, req : req});
}
async function deleteEnvironment(req, res){
    let envId = req.body.id;
    const response = await removeEnvironment(envId);
    res.json(response);
}
async function updateEnvironment(req, res) {
    let envId = req.body.id;
    let envName = req.body.name;
    const response = await editEnvironment(envId,envName);
    res.json(response);
}
module.exports = { createEnvironement,  getAllEnvironments, deleteEnvironment, updateEnvironment }