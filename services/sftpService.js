const sql = require("msnodesqlv8");

const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const getSftpCredentials = () => {
    const query = "SELECT site_env_id as Id,site_env_siteid as SiteId,site_env_envid as EnvId, site_name as SiteName,env_name as Environment,[site_env_host] as Host ,[site_env_port] as [Port] ,[site_env_username] as Username,[site_env_password] as [Password] FROM [dbo].[site_env_mapping] join site_master on site_id=site_env_siteid join env_master  on site_env_envid = env_id";
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};
const setSFTPDetail = (sftpDetail) => {
    const checkQuery = `select site_env_id from [dbo].[site_env_mapping] where site_env_siteid=${sftpDetail.siteId} and site_env_envid=${sftpDetail.envId}`;
    return new Promise((resolve, reject) => {
        sql.query(connectionString, checkQuery, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result[0]) {
                    resolve('');
                }
                else {
                    resolve(await setSFTP(sftpDetail))
                }
            }
        });
    });
}
const setSFTP = (sftpDetail) => {
    const query = `INSERT INTO [dbo].[site_env_mapping] ([site_env_siteid],[site_env_envid],[site_env_host],[site_env_port] ,[site_env_username],[site_env_password]) values (${sftpDetail.siteId},${sftpDetail.envId},'${sftpDetail.host}',${sftpDetail.port},'${sftpDetail.username}','${sftpDetail.password}')`;
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
const removeSFTPDetail = (id) => {
    const query = `delete from [dbo].[site_env_mapping] where [site_env_id]=${id}`;
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
const editSFTP = (sftpDetail) => {
    const query = `UPDATE [dbo].[site_env_mapping] set [site_env_siteid]=${sftpDetail.siteId},[site_env_envid]=${sftpDetail.envId},[site_env_host]='${sftpDetail.host}',[site_env_port]=${sftpDetail.port} ,[site_env_username]='${sftpDetail.username}',[site_env_password]='${sftpDetail.password}' where site_env_id=${sftpDetail.id}`;
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
module.exports = { getSftpCredentials, setSFTPDetail, removeSFTPDetail, editSFTP }