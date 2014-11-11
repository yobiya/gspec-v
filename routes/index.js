var util = require('util');
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

var commit = require('../models/commit')(mongoose);

// Main page
router.get('/', function(req, res) {
  res.render('index', { title: 'GSpecV' });
});

/**
 * @brief ファイルを検索して、結果を返す
 */
router.post('/find', function(request, response) {
  commit.find(function(result) {
    response.send(result);
  });
});

/**
 * @brief ファイルをコミットする
 */
router.post('/commit', function(request, response) {
  var files = request.files.file;
  var comment = request.body.comment;
  if(!Array.isArray(files)) {
    // ファイル情報が配列で無ければ、配列に変換する
    files = [request.files.file];
  }
  commit.commit(files, comment);
  response.send({ response_code: 0 });
});

/**
 * @brief ファイルをダウンロードする
 */
router.get('/download/:file_name/:version', function(request, response) {
  var fileName = request.params.file_name;
  var version = request.param('version');
  commit.download(fileName, version, function(downloadPath) {
    console.log(util.inspect(downloadPath));
    console.log(fileName);
    response.download(downloadPath, fileName);
  });
});

/**
 * @brief 各POSTメソッドの情報を出力する
 */
router.get('/post_info_list', function(request, response) {
  var postInfos = [
                    { name: 'find', param: [] }
                  ];
  response.send(postInfos);
});

module.exports = router;
