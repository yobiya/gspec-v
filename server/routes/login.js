var util = require('util');
var cookie = require('cookie');
var express = require('express');
var router = express.Router();
var auth;
router.setup = function (mongoModels) {
    auth = require('../models/auth')(mongoModels);
    return this;
};
// Login page
router.get('/', function (request, response) {
    response.render('login', { title: 'GSpec-V' });
});
router.get('/logout', function (request, response) {
    delete request.session.user;
    response.redirect(302, '/login');
});
router.post('/login_auth', function (request, response) {
    auth.login(request.body.user_name, request.body.password, function (sessionValue) {
        // ログイン成功
        request.session.user = sessionValue;
        request.session.save(function () {
            response.redirect(302, '../main_page');
        });
    }, function () {
        // ログイン失敗
        response.redirect('/');
    });
});
module.exports = router;
