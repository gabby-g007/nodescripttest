
const { loginAuth } = require('../services/login/loginService');


async function loginPage(req, res) {
    res.render("admin/login");
}
async function dashboard(req, res) {
    res.render("admin/dashboard");
}
async function loginCheck(req, res) {
    let userdata = {
        username: req.body.username,
        password: req.body.password
    };
    const token = await loginAuth(userdata);
    res.cookie('authToken', token);
    res.json(token);
}
async function logMeOut(req, res) {
    res.clearCookie('authToken');
    res.redirect("/login");
}
module.exports = { loginPage, dashboard, loginCheck, logMeOut }