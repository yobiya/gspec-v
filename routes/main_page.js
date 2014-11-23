var util = require('util');
var cookie = require('cookie');
var express = require('express');
var router = express.Router();
var mongoModels;

// MongoDBへの接続
(function() {
  var mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/gspecv');
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('Connect to mongodb.');
  });

  mongoModels = require('../models/mongo_model')(mongoose);
})();

var commit = require('../models/commit')(mongoModels);
var tag = require('../models/tag')(mongoModels);

// Main page
router.get('/main_page', loginCheck, function(request, response) {
  response.render('main_page', { title: 'GSpec-V', user_name: request.session.user });
});

/// @brief ファイルを検索して、結果を返す
router.post('/find', function(request, response) {
  var params = postParams(request);
  params.tags = params.tags || {};
  var findProvision = {
    fileNames: toArray(params['file_names[]']),
    inclusionAllTagNames: toArray(params['inclusion_all_tag_names[]']),
    inclusionAnyTagNames: toArray(params['inclusion_any_tag_names[]']),
    exclusionTagNames: toArray(params['exclusion_tag_names[]'])
  };

  commit.find(findProvision, function(result) {
    response.send(result);
  });
});

/// @brief タグの編集情報を返す
router.post('/edit_tag_info', function(request, response) {
  var params = postParams(request);
  tag.getTagEditInfo(params.file_name, function(result) {
    response.send(result);
  });
});

/// @brief タグの編集結果を適用する
router.post('/apply_tag', function(request, response) {
  var params = postParams(request);
  var fileName = params.file_name;
  var tagNames = toArray(params['tag_names[]']);

  tag.applyTagEditInfo(fileName, tagNames, function(result) {
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

/// @brief 最新のファイルをダウンロードする
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

/// @brief 最新のタグ名一覧を取得する
router.post('/latest_tag_names', function(request, response) {
  tag.findAllLatestTagNames(function(tagNames) {
    response.send(tagNames);
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

/**
 * @brief 値を配列に変換する
 *
 * @param data 変換元のデータ
 *
 * @return 配列
 */
function toArray(data) {
  if(typeof data === 'undefined') {
    return [];
  }

  var result = data || [];
    if(!Array.isArray(data)) {
    result = [data];
  }

  return result;
}

module.exports = router;
