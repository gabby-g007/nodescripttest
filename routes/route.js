
const express = require('express');
const router = express.Router();
const { getBranchesLists, getAllFiles, getAllCommits, createRollout, rolloutDeployment, getEnvBySite, rolloutScript, uninstallRollout, productionRollout } = require('../controllers/wmsController');


router.get('/', getBranchesLists);
router.get('/commits', getAllCommits);
router.get('/files', getAllFiles);
router.post('/createRollout', createRollout);
router.post('/deploy', rolloutDeployment);
router.get('/environment/:id', getEnvBySite);
router.post('/rolloutScript',rolloutScript);
router.post('/uninstallRollout', uninstallRollout);
router.post('/productionRollout', productionRollout);

module.exports = router;