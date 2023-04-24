const sql = require("msnodesqlv8");

const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const queryPromise = (siteId, envId) => {
    const query = "SELECT [site_env_host] as Host ,[site_env_port] as [Port] ,[site_env_username] as Username,[site_env_password] as [Password] FROM [dbo].[site_env_mapping] where site_env_siteid=" + siteId + " and site_env_envid=" + envId;
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

module.exports = queryPromise

