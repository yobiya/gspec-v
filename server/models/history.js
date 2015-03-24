/// <reference path="../../../typings/lodash/lodash.d.ts" />
/// <reference path="../../../typings/jquery/jquery.d.ts" />
/**
 * @brief 履歴
 */
module.exports = function (mongoModels) {
    var fs = require('fs');
    var path = require('path');
    var constants = require('./constants');
    var _ = require('lodash');
    var $ = require('jquery-deferred');
    var exec = require('child_process').exec;
    /**
     * @brief ファイルの履歴を取得する
     *
     * @param fileName ファイル名
     *
     * @return deferredオブジェクト
     */
    function history(fileName) {
        return (function () {
            var d = new $.Deferred();
            mongoModels.commitInfo.find({ name: fileName }, function (error, docs) {
                if (error) {
                    d.reject(error);
                    return;
                }
                var infoArray = _.map(docs, function (doc) {
                    return {
                        _id: doc._id,
                        name: doc.name,
                        version: doc.version,
                        comment: doc.comment,
                        user_name: doc.user_name,
                        commit_time: (new Date(doc.commit_time)).toFormat('YYYY/MM/DD HH24:MI')
                    };
                });
                // @todo 必要な外部ツールが使用可能か確認する
                var isDiffSupport = false;
                if (/\.xlsx?/.test(fileName)) {
                    // 拡張子がxlsかxlsxの場合
                    // 差分表示をサポートしている
                    isDiffSupport = true;
                }
                d.resolve({ info_array: infoArray, diff_support: isDiffSupport });
            });
            return d.promise();
        })();
    }
    /**
     * @brief ファイルの差分情報を取得する
     *
     * @param fileName ファイル名
     * @param oldVersion 比較するファイルの古いバージョン
     * @param newVersion 比較するファイルの新しいバージョン
     *
     * @return deferredオブジェクト
     */
    function diff(fileName, oldVersion, newVersion) {
        function convertToTempHtmlPath(originalFilePath) {
            var fileExt = path.extname(originalFilePath);
            var fileBaseName = path.basename(originalFilePath, fileExt);
            return path.join(constants.DIFF_FILE_TEMP_DIRECTORY, fileBaseName) + '.html';
        }
        return (function () {
            var d = new $.Deferred();
            mongoModels.commitInfo.find({ name: fileName }, function (error, docs) {
                // 比較するファイルのパスを取得する
                if (error) {
                    d.reject(error);
                    return;
                }
                var oldFilePath;
                var newFilePath;
                docs.forEach(function (doc) {
                    if (doc.version == oldVersion) {
                        oldFilePath = doc.path;
                    }
                    else if (doc.version == newVersion) {
                        newFilePath = doc.path;
                    }
                });
                d.resolve(oldFilePath, newFilePath);
            });
            return d.promise();
        })().then(function (oldFilePath, newFilePath) {
            // 比較するファイルをHTMLに変換する
            var d = new $.Deferred();
            // @todo 変換済みのファイルが存在したら、変換は行わない
            var command = 'soffice --headless --convert-to html --outdir ' + constants.DIFF_FILE_TEMP_DIRECTORY + ' ' + oldFilePath + ' ' + newFilePath;
            exec(command, function (error, stdout, stderr) {
                if (error) {
                    d.reject(error.code);
                    return;
                }
                d.resolve(convertToTempHtmlPath(oldFilePath), convertToTempHtmlPath(newFilePath));
            });
            return d.promise();
        }).then(function (oldDiffHtmlFilePath, newDiffHtmlFilePath) {
            // HTMLファイルを比較して、差分情報を取得する
            var d = new $.Deferred();
            var command = 'diff -E -B ' + oldDiffHtmlFilePath + ' ' + newDiffHtmlFilePath;
            command += ' | grep "^[0-9]"'; // 差分ある行の情報のみにフィルタリングする（Cygwin環境では\\dが期待通りに認識されなかったので数字は[0-9]で扱う）
            exec(command, function (error, stdout, stderr) {
                if (error) {
                    d.reject(error.code);
                    return;
                }
                d.resolve(oldDiffHtmlFilePath, newDiffHtmlFilePath, stdout);
            });
            return d.promise();
        }).then(function (oldDiffHtmlFilePath, newDiffHtmlFilePath, diffInfo) {
            // 比較する古いHTMLを読み込む
            var d = new $.Deferred();
            fs.readFile(oldDiffHtmlFilePath, { encoding: 'utf-8' }, function (error, data) {
                if (error) {
                    d.reject(error);
                    return;
                }
                d.resolve(data, newDiffHtmlFilePath, diffInfo);
            });
            return d.promise();
        }).then(function (oldDiffHtml, newDiffHtmlFilePath, diffInfo) {
            // 比較する新しいファイルを読み込む
            var d = new $.Deferred();
            fs.readFile(newDiffHtmlFilePath, { encoding: 'utf-8' }, function (error, data) {
                if (error) {
                    d.reject(error);
                    return;
                }
                d.resolve(oldDiffHtml, data, diffInfo);
            });
            return d.promise();
        });
    }
    return {
        history: history,
        diff: diff
    };
};
