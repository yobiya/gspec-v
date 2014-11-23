var util = require('util');
var cookie = require('cookie');
var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

// MongoDBへの接続
(function() {
  mongoose.connect('mongodb://localhost/gspecv');
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('Connect to mongodb.');
  });
})();

var auth = require('../models/auth')(mongoose);

// Login page
router.get('/', function(request, response) {
  response.render('login', { title: 'GSpec-V' });
});

router.get('/logout', function(request, response) {
  delete request.session.user;

  response.redirect(302, '/login');
});

router.post('/login_auth', function(request, response) {
  auth.login(
    request.body.user_name,
    request.body.password,
    function(sessionValue) {
      // ログイン成功
      request.session.user = sessionValue;
      request.session.save(function() {
        response.redirect(302, '../main_page');
      });
    },
    function() {
      // ログイン失敗
      response.redirect('/' );
    }
  );
});

module.exports = router;

