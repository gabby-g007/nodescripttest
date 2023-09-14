
const sql = require("msnodesqlv8");
const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const insertSite = (siteName) => {
    const checkQuery = `select site_id from [dbo].[site_master] where site_name='${siteName}'`;
    return new Promise((resolve, reject) => {
        sql.query(connectionString, checkQuery, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result[0]) {
                    resolve('');
                }
                else {
                    resolve(await setSite(siteName));
                }
            }
        });
    });
};
const setSite = (siteName) => {
    const query = "insert into site_master ([site_name]) values('" + siteName + "')";
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

const getSites = () => {
    const query = "SELECT site_id as Id, [site_name] as SiteName ,[site_id] as SiteId FROM [dbo].[site_master] order by site_name asc";
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
const removeSite = (id) => {
    const query = `delete from [dbo].[site_master] where [site_id]=${id}`;
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
//editSite
const editSite = (id, siteName) => {
    const query = "update site_master set [site_name] = '" + siteName + "' where site_id=" + id;
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
module.exports = { insertSite, getSites, removeSite, editSite }