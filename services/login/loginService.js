var jwt = require('jsonwebtoken');
global.config = require('../../config');
const bcrypt = require('bcryptjs');
const sql = require("msnodesqlv8");
const connectionString = "server=DESKTOP-KUVG2Q9;Database=WMSAutomation;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const loginAuth = (userdata) => {
    const query = "SELECT user_username as Name , user_password as [Password] FROM [dbo].[user_master] where user_username='" + userdata.username + "'";
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                let token = '';
                if (result[0]) {
                    let isMatched = bcrypt.compareSync(userdata.password, result[0].Password);                    
                    if (isMatched) {
                        token = jwt.sign(userdata, global.config.secretKey, {
                            algorithm: global.config.algorithm,
                            expiresIn: '1m'
                        });
                    }
                }
                resolve(token);
            }
        });
    });
};

module.exports = { loginAuth }