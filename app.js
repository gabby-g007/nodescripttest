const express = require('express');
const cors = require('cors');
const middlewares = require('./middlewares');
const { getBranchesLists, getAllFiles, getAllCommits } = require('./controllers/controllers');
const getFileContent = require('./controllers/content');
const { createNewFile } = require('./controllers/createFiles')
const { createPackage, makeUninstallDir, generateZipDir, deployScript, executeUninstall, getToastAlert } = require('./controllers/createRollout')
const flash = require('connect-flash');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require('fs');
require('dotenv').config();
const sql = require("msnodesqlv8");
const moment = require('moment');
var cookieParser = require('cookie-parser')
    // express-toastr
    , toastr = require('express-toastr');
const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

let branch = '';
let shaKey = '';
let rollOut = '';
const user = 'gabby-g007';//req.params.user;
const reponame = 'WMS' //req.params.reponame;
const siteList = [];
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('controllers'));
app.use(cors());
app.use(middlewares.setHeaders);
app.use(cookieParser('secret'));
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}))

app.use(flash());
app.use(toastr());

app.get('/', async (req, res) => {
    const branchList = await getBranchesLists();
    res.render('pages/home', { response: branchList, req: req });
})

app.get('/commits', async (req, res) => {
    const commits = await getAllCommits();
    res.render('pages/commits', { respCommit: commits, moment: moment });
})
app.get('/files', async (req, res) => {
    shaKey = req.query.sha
    rollOut = req.query.commit;
    let offset = rollOut.indexOf('_')
    if (offset > 0) {
        rollOut = rollOut.substring(offset + 1, rollOut.length)
    }
    const allFiles = await getAllFiles(shaKey);
    res.render('pages/files', { changedFiles: allFiles, message: '' });
})
app.get('/createFile', async (req, res) => {
    const fileName = req.query.fileName
    const content = await getFileContent(user, reponame, shaKey, fileName)
    const newFile = await createNewFile(branch, content, fileName)
    res.render('pages/createFile', { content: newFile });
})
app.post('/deployRollout', async function (req, res) {
    const changedFiles = await getAllFiles(shaKey)
    let siteId = 1;
    let envId = 1;
    //const query = "select top 1 rollout_name from rollout_master where rollout_name='" + rollOut + "'";
    //sql.query(connectionString, query, (err, rows) => {
    //if (rows.length <= 0) {
    // const rolloutQuery = "insert into rollout_master (rollout_name) values('" + rollOut + "')";
    //sql.query(connectionString, rolloutQuery, (err, response) => {
    //   if (err) return err;
    let path = 'hotfixes/' + rollOut;
    fs.access(path, (error) => {
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
});
app.post('/deploy', async function (req, res) {
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
    const branchList = await getBranchesLists()
    res.render('pages/home', { response: branchList, req: req });
});

app.get('/environment/:id', (req, res) => {
    const query = "SELECT [site_env_envid] as id, [env_name] as [name]  FROM [dbo].[site_env_mapping],env_master where site_env_siteid=" + req.params.id + " and env_id=site_env_envid";
    sql.query(connectionString, query, (err, rows) => {
        res.json(rows);
    });
});
app.post('/rolloutScript', async (req, res) => {
    let siteId = req.body.siteId;
    let envId = req.body.envId;
    let excType = 'ins'; /* 'ins' goes to INSTALL/ROLLOUT */
    const response1 = await getAllCommits()
    shaKey = response1[0].commitId
    rollOut = response1[0].comment;
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
    const changedFiles = await getAllFiles(shaKey);
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
                        createPackage(path, changedFiles, rollOut,  shaKey);
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

    setTimeout(() => {
        res.json(deployRollout(req, path, serverPath, siteId, envId, rollOut, excType));
    }, 3000);
})

function deployRollout(req, path, serverPath, siteId, envId, rollOut, excType) {
    let alert = '';

    if (excType === 'uni') {
        serverPath = 'LES\\hotfixes\\' + rollOut + '\\UNINSTALL_' + rollOut;
        alert = 'The rollout script has been uninstall successfuly from QA server.';
    }
    else {
        alert = 'The process of rollout script has been completed successfuly from QA server.';
    }
    deployScript(req, path, serverPath, siteId, envId, rollOut, connectionString, excType);
    return alert;
}
app.post('/uninstallRollout', async (req, res) => {
    let rollOut = req.body.rollout;
    let siteId = req.body.siteId;
    let envId = req.body.envId;
    let envPath = '';
    let environment = 'QA Server';
    if (envId == 2) {
        envPath = 'Prod\\';
        environment = 'Production';
    }
    let path = 'hotfixes/' + rollOut + '/UNINSTALL_' + rollOut;
    let serverPath = envPath + 'LES\\hotfixes\\' + rollOut + '\\UNINSTALL_' + rollOut;

    fs.readdir(path, (err, files) => {
        if (err) {
            res.json("The rollout name does not exists at " + environment + ".");
        }
        else {
            let resp = executeUninstall(req, serverPath, siteId, envId, connectionString, environment);
            res.json(resp);
        }
    })

});
app.post('/productionRollout', async (req, res) => {
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

});

app.listen(PORT, () => console.log(`Server started on port http://localhost:${PORT}/`))