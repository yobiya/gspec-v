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

var commit = require('../models/commit')(mongoose);

// Main page
router.get('/main_page', loginCheck, function(request, response) {
  response.render('main_page', { title: 'GSpec-V', user_name: request.session.user });
});

/// @brief ファイルを検索して、結果を返す
router.post('/find', function(request, response) {
  var fileNames = request.body['file_names[]'];
  if(fileNames && !Array.isArray(fileNames)) {
    fileNames = [fileNames];
  }
  commit.find(fileNames, function(result) {
    response.send(result);
  });
});

/// @brief タグの編集情報を返す
router.post('/edit_tag_info', function(request, response) {
  commit.getTagEditInfo(request.body.file_name, function(result) {
    response.send(result);
  });
});

/// @brief タグの編集結果を適用する
router.post('/apply_tag', function(request, response) {
  var params = postParams(request);
  params.tag_names = params.tag_names || [];
  commit.applyTagEditInfo(params.file_name, params.tag_names, function(result) {
    response.send(result);
  });
});

/// @brief ファイルをコミットする
router.post('/commit', function(request, response) {
  var files = request.files.file;
  var comment = request.body.comment;
  if(!Array.isArray(files)) {
    // ファイル情報が配列で無ければ、配列に変換する
    files = [request.files.file];
  }
  commit.commit(files, comment, request.session.user);
  response.send({ response_code: 0 });
});

/// @brief ファイルをダウンロードする
router.get('/download/:document_id', function(request, response) {
  commit.download(request.params.document_id, function(downloadPath, fileName) {
    response.download(downloadPath, fileName);
  });
});

/// @brief バージョン番号の付いたファイルをダウンロードする
router.get('/download_with_version/:document_id', function(request, response) {
  commit.downloadWithVersion(request.params.document_id, function(downloadPath, fileName) {
    response.download(downloadPath, fileName);
  });
});

/// @brief ファイルの履歴を取得する
router.post('/history', function(request, response) {
  var fileName = postParams(request).file_name;

  commit.history(fileName, function(historyInfos) {
    response.send(historyInfos);
  });
});

/// @brief ログインされているかチェックする
function loginCheck(request, response, next) {
  if(request.session.user) {
    next();
  } else {
    // セッションが無ければログイン画面へリダイレクト
    response.redirect('login');
  }
}

/// @brief リクエストの方式によってパラメーターの取得方法が変わるので、適切な変換を行う
function postParams(request) {
  if(Object.keys(request.query).length === 0) {
    return request.body;
  }

  return request.query;
}

module.exports = router;
