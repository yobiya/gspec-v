/// <reference path="../../../typings/express/express.d.ts" />
var util = require('util');
var cookie = require('cookie');
var express = require('express');
var tag = require('../models/tag');
var commit = require('../models/commit');
var router = express.Router();
var History_g;
router.setup = function (mongoModels) {
    commit.setup(mongoModels);
    tag.setup(mongoModels);
    History_g = require('../models/history')(mongoModels);
    return this;
};
// Main page
router.get('/main_page', loginCheck, function (request, response) {
    response.render('main_page', { title: 'GSpec-V', user_name: request.session.user });
});
/// @brief ファイルを検索して、結果を返す
router.post('/find', function (request, response) {
    var params = postParams(request);
    params.tags = params.tags || {};
    var findProvision = {
        userName: request.session.user,
        fileNames: toArray(params['file_names[]']),
        inclusionAllTagNames: toArray(params['inclusion_all_tag_names[]']),
        inclusionAnyTagNames: toArray(params['inclusion_any_tag_names[]']),
        exclusionTagNames: toArray(params['exclusion_tag_names[]'])
    };
    commit.find(findProvision, function (result) {
        response.send(result);
    });
});
/// @brief タグの編集情報を返す
router.post('/edit_tag_info', function (request, response) {
    var params = postParams(request);
    tag.getTagEditInfo(request.session.user, params.file_name, function (result) {
        response.send(result);
    });
});
/// @brief タグの編集結果を適用する
router.post('/apply_tag', function (request, response) {
    var params = postParams(request);
    var fileName = params.file_name;
    var tagNames = toArray(params['tag_names[]']);
    tag.applyTagEditInfo(fileName, tagNames, function (result) {
        response.send(result);
    });
});
/// @brief ファイルにタグを追加する
router.post('/add_tag', function (request, response) {
    var params = postParams(request);
    var tagNames = toArray(params['tag_names[]']);
    tag.addTags(params.commit_document_id, tagNames).done(function () {
        response.send({ response_code: 0 });
    }).fail(function (errorMessage) {
        response.send({ response_code: 1, message: errorMessage });
    });
});
/// @brief コミットの安全性をチェックする
router.post('/check_commit_safety', function (request, response) {
    var params = postParams(request);
    commit.checkSafety(toArray(params['file_names[]']), request.session.user).done(function (docs) {
        response.send({ response_code: 0, docs: docs });
    }).fail(function (errorMessage) {
        response.send({ response_code: 1, message: errorMessage });
    });
});
/// @brief ファイルをコミットする
router.post('/commit', function (request, response) {
    var files = request.files.file;
    var comment = request.body.comment;
    if (!Array.isArray(files)) {
        // ファイル情報が配列で無ければ、配列に変換する
        files = [request.files.file];
    }
    commit.commit(files, comment, request.session.user);
    response.send({ response_code: 0 });
});
/// @brief 最新のファイルをダウンロードする
router.get('/download/:document_id', function (request, response) {
    commit.download(request.session.user, request.params.document_id, function (downloadPath, fileName) {
        response.download(downloadPath, fileName);
    });
});
/// @brief バージョン番号の付いたファイルをダウンロードする
router.get('/download_with_version/:document_id', function (request, response) {
    commit.downloadWithVersion(request.params.document_id, function (downloadPath, fileName) {
        response.download(downloadPath, fileName);
    });
});
/// @brief 最新のタグ名一覧を取得する
router.post('/latest_tag_names', function (request, response) {
    tag.findAllLatestTagNames(function (tagNames) {
        response.send(tagNames);
    });
});
/// @brief ファイルの履歴を取得する
router.post('/history', function (request, response) {
    var fileName = postParams(request).file_name;
    History_g.history(fileName).done(function (historyInfo) {
        response.send(historyInfo);
    }).fail(function (errorMessage) {
        response.send({ response_code: 1, message: errorMessage });
    });
});
/// @brief ファイルの差分情報を取得する
router.post('/diff', function (request, response) {
    var params = postParams(request);
    History_g.diff(params.file_name, params.old_version, params.new_version).done(function (oldDiffHtml, newDiffHtml, diffInfo) {
        response.send({
            response_code: 0,
            old_diff_html: oldDiffHtml,
            new_diff_html: newDiffHtml,
            diff_info: diffInfo
        });
    }).fail(function (errorMessage) {
        response.send({ response_code: 1, message: errorMessage });
    });
});
// POSTリクエストを受け取る
function post(path, action) {
    router.post(path, function (request, response) {
        var params = postParams(request);
        action(params, response);
    });
}
/// @brief ユーザーのコミット確認状況を取得する
post('/users_view_info', function (params, response) {
    commit.usersView(params.file_name).done(function (usersViewInfo) {
        response.send(usersViewInfo);
    }).fail(function (errorMessage) {
        response.send({ response_code: 1, message: errorMessage });
    });
});
/// @brief ログインされているかチェックする
function loginCheck(request, response, next) {
    if (request.session.user) {
        next();
    }
    else {
        // セッションが無ければログイン画面へリダイレクト
        response.redirect('login');
    }
}
/// @brief リクエストの方式によってパラメーターの取得方法が変わるので、適切な変換を行う
function postParams(request) {
    if (Object.keys(request.query).length === 0) {
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
    if (typeof data === 'undefined') {
        return [];
    }
    var result = data || [];
    if (!Array.isArray(data)) {
        result = [data];
    }
    return result;
}
module.exports = router;
