async function userLogin() {
    const txtUsername = document.querySelector('#username');
    const txtPassword = document.querySelector('#password');
    let userData = { username: txtUsername.value, password: txtPassword.value }
    const endpoint = '/loginCheck';
    let token = await Post(endpoint, userData);
    if (!token) {
        alert('Username OR Password is not wrong. Please check and try again.')
    }
    window.location.replace('/dashboard');
}

async function createSite() {
    const txtSiteid = document.querySelector('#siteid');
    const txtSitename = document.querySelector('#sitename');
    const btnSubmit = document.querySelector('#btnSubmit');

    if (txtSitename.value == "") {
        alert("Site Name must be filled out");
        return false;
    }
    if (btnSubmit.value === 'Update') {
        let siteData = { id: txtSiteid.value, sitename: txtSitename.value }
        const endpoint = '/updateSite';
        const resp = await Post(endpoint, siteData);
        if (resp) {
            alert('Site has been updated successfully.')
        }
    }
    else {
        let siteData = { sitename: txtSitename.value }
        const endpoint = '/createSite';
        const resp = await Post(endpoint, siteData);
        if (resp) {
            alert('Site has been added successfully.')
        }
        else {
            alert('Site name is already exists.')
        }
    }
    window.location.replace('/manageSite');
}

async function editSite(id, sitename) {
    const txtSiteid = document.querySelector('#siteid');
    const txtSitename = document.querySelector('#sitename');
    const btnSubmit = document.querySelector('#btnSubmit');
    txtSitename.value = sitename;
    txtSiteid.value = id;
    btnSubmit.value = 'Update';
}
async function deleteSite(id) {
    var result = confirm("Are you sure you want to delete?");
    if (result) {
        let siteData = {
            id: id,
        }
        const endpoint = '/deleteSite';
        const res = await Post(endpoint, siteData);
        if (res) {
            alert('Site detail has been deleted successfully.')
        }

        window.location.replace('/manageSite');
    }
    else {
        window.location.replace('/manageSite');
    }
}
async function createEnvironment() {
    const envid = document.querySelector('#envid');
    const txtEnvname = document.querySelector('#envname');

    if (btnSubmit.value === 'Update') {
        let envData = { id: envid.value, name: txtEnvname.value }
        const endpoint = '/updateEnvironment';
        const resp = await Post(endpoint, envData);
        if (resp) {
            alert('Environment has been updated successfully.')
        }
    }
    else {
        let envData = { envname: txtEnvname.value }
        const endpoint = '/createEnvironement';
        const response = await Post(endpoint, envData)
        if (response) {
            alert('Environment has been added successfully.')
        }
        else {
            alert('Environment name is already exists.')
        }
    }
    window.location.replace('/manageEnvironment');
}
//updateEnvironment
async function editEnvironment(id, name) {
    const envid = document.querySelector('#envid');
    const envname = document.querySelector('#envname');
    const btnSubmit = document.querySelector('#btnSubmit');
    envname.value = name;
    envid.value = id;
    btnSubmit.value = 'Update';
}
async function deleteEnvironment(id) {
    var result = confirm("Are you sure you want to delete?");
    if (result) {
        let siteData = {
            id: id,
        }
        const endpoint = '/deleteEnvironment';
        const res = await Post(endpoint, siteData);
        if (res) {
            alert('Environment detail has been deleted successfully.')
        }

        window.location.replace('/manageEnvironment');
    }
    else {
        window.location.replace('/manageEnvironment');
    }
}
//createSFTP
async function createSFTP() {
    const txtId = document.querySelector('#sftpid');
    const ddlSite = document.querySelector('#site');
    const ddlEnv = document.querySelector('#environment');
    const txtHost = document.querySelector('#host');
    const txtPort = document.querySelector('#port');
    const txtUsername = document.querySelector('#username');
    const txtPassword = document.querySelector('#password');
    const btnSubmit = document.querySelector('#btnSubmit');
    if (btnSubmit.value === 'Update') {
        let sftpData = {
            id: txtId.value,
            site: ddlSite.value,
            environment: ddlEnv.value,
            host: txtHost.value,
            port: txtPort.value,
            username: txtUsername.value,
            password: txtPassword.value
        }
        const endpoint = '/updateSFTP';
        const resp = await Post(endpoint, sftpData);
        if (resp) {
            alert('SFTP detail has been updated successfully.')
        }
     }
    else {
        let sftpData = {
            site: ddlSite.value,
            environment: ddlEnv.value,
            host: txtHost.value,
            port: txtPort.value,
            username: txtUsername.value,
            password: txtPassword.value
        }
        const endpoint = '/createSFTP';
        const resp = await Post(endpoint, sftpData);
        if (resp) {
            alert('SFTP detail has been added successfully.')
        }
        else {
            alert('SFTP detail is already exists.')
        }
    }
    window.location.replace('/sftpCredential');
}
async function editSFTP(id, siteid, envid, host, port, username, password) {
    const txtId = document.querySelector('#sftpid');
    const txtEnvironment = document.querySelector('#environment');
    const txtSite = document.querySelector('#site');
    const txtHost = document.querySelector('#host');
    const txtPort = document.querySelector('#port');
    const txtUsername = document.querySelector('#username');
    const txtPassword = document.querySelector('#password');

    const btnSubmit = document.querySelector('#btnSubmit');
    txtId.value = id;
    txtEnvironment.value = envid;
    txtSite.value = siteid;
    txtHost.value = host;
    txtPort.value = port;
    txtUsername.value = username;
    txtPassword.value = password;
    btnSubmit.value = 'Update';
}
async function deleteSFTP(id) {
    var result = confirm("Are you sure you want to delete?");
    if (result) {
        let sftpData = {
            id: id,
        }
        const endpoint = '/deleteSFTPDetail';
        const resp = await Post(endpoint, sftpData);
        if (resp) {
            alert('SFTP detail has been deleted successfully.')
        }

        window.location.replace('/sftpCredential');
    }
    else {
        window.location.replace('/sftpCredential');
    }
}
async function Post(endpoint, siteData) {
    const res = await fetch(endpoint, {
        method: "POST", // or 'PUT'
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(siteData),
    });
    return await res.json();
}

