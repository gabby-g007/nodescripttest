
const express = require('express');
const router = express.Router();
const { getBranchesLists, getAllFiles, getAllCommits, createRollout, rolloutDeployment, getEnvBySite, rolloutScript, uninstallRollout, productionRollout } = require('../controllers/wmsController');
const {loginPage, dashboard, loginCheck, logMeOut} = require('../controllers/loginController');
const {getAllSites, createSite, deleteSite, updateSite} = require('../controllers/siteController');
const {getAllEnvironments, createEnvironement, deleteEnvironment, updateEnvironment} = require('../controllers/envController');
const {getAllCredentials, createSFTP, deleteSFTPDetail, updateSFTP} = require('../controllers/sftpController');
const { VerifyToken } = require('../middlewares/verifyToken');
const { verify } = require('jsonwebtoken');

router.get('/', getBranchesLists);
router.get('/commits', getAllCommits);
router.get('/files', getAllFiles);
router.post('/createRollout', createRollout);
router.post('/deploy', rolloutDeployment);
router.get('/environment/:id', getEnvBySite);
router.post('/rolloutScript',rolloutScript);
router.post('/uninstallRollout', uninstallRollout);
router.post('/productionRollout', productionRollout);
router.get('/login', loginPage);
router.post('/loginCheck', loginCheck);
router.get('/dashboard', VerifyToken , dashboard);
router.post('/createSite', VerifyToken, createSite);
router.post('/updateSite', VerifyToken, updateSite);
router.get('/manageSite', VerifyToken, getAllSites);
router.post('/deleteSite',VerifyToken, deleteSite);
router.post('/createEnvironement', VerifyToken, createEnvironement);
router.get('/manageEnvironment', VerifyToken, getAllEnvironments);
router.post('/deleteEnvironment', VerifyToken, deleteEnvironment);
router.post('/updateEnvironment', VerifyToken, updateEnvironment);
router.post('/createSFTP', VerifyToken, createSFTP);
router.get('/sftpCredential', VerifyToken, getAllCredentials);
router.post('/deleteSFTPDetail', VerifyToken, deleteSFTPDetail);
router.post('/updateSFTP', VerifyToken, updateSFTP);
router.get('/logout', logMeOut);

module.exports = router;