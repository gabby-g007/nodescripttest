
var jwt = require('jsonwebtoken');

function VerifyToken(req, res, next) {
    var token = req.cookies.authToken;
    //var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, global.config.secretKey,
            {
                algorithm: global.config.algorithm
            }, function (err, decoded) {
                if (err) {
                    res.redirect('/login')
                }
                else {
                    req.decoded = decoded;
                    next();
                }
            });
    } else {
        res.redirect('/login');
    }
}
module.exports = { VerifyToken }