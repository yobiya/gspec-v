var express = require('express');
var router = express.Router();

// Login page
router.get('/', function(request, response) {
  response.render('login', { title: 'GSpec-V' });
});

module.exports = router;

