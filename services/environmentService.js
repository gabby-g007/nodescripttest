
const sql = require("msnodesqlv8");
const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const insertEnvironement = (envName) => {
    const query = "select env_id from env_master where [env_name]='" + envName + "'";
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result[0]) {
                    resolve('');
                }
                else {
                    resolve(await setEnvironement(envName));
                }
            }
        });
    });
};
const setEnvironement = (envName) => {
    const query = "insert into env_master ([env_name]) values('" + envName + "')";
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
const getEnvironments = () => {
    const query = "SELECT [env_name] as envName ,[env_id] as envId FROM [dbo].[env_master] order by env_name asc";
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
const removeEnvironment = (id) => {
    const query = "delete FROM [dbo].[env_master] where env_id=" + id;
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
const editEnvironment = (id, name) => {
    const query = "update env_master set [env_name]='" + name + "' where env_id=" + id;
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
module.exports = { insertEnvironement, getEnvironments, removeEnvironment, editEnvironment }