/**
 * @brief 履歴
 */
module.exports = function(mongoModels) {
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
    return (function() {
      var d = new $.Deferred();

      mongoModels.commitInfo.find({ name: fileName }, function(error, docs) {
        if(error) {
          d.reject(error);
          return;
        }

        var infoArray = _.map(docs, function(doc) {
          return {
            _id: doc._id,
            name: doc.name,
            version: doc.version,
            comment: doc.comment,
            user_name: doc.user_name,
            commit_time: new Date(doc.commit_time).toFormat('YYYY/MM/DD HH24:MI')
          };
        });

        // @todo 必要な外部ツールが使用可能か確認する
        var isDiffSupport = false;
        if(/\.xlsx?/.test(fileName)) {
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
    return (function() {
      var d = new $.Deferred();

      mongoModels.commitInfo.find({ name: fileName }, function(error, docs) {
        if(error) {
          d.reject(error);
          return;
        }

        var oldFilePath;
        var newFilePath;
        docs.forEach(function(doc) {
          if(doc.version == oldVersion) {
            oldFilePath = doc.path;
          } else if(doc.version == newVersion) {
            newFilePath = doc.path;
          }
        });

        d.resolve(oldFilePath, newFilePath);
      });

      return d.promise();
    })()
    .then(function(oldFilePath, newFilePath) {
      var d = new $.Deferred();

      var command = 'soffice --headless --convert-to html --outdir ' + constants.DIFF_FILE_TEMP_DIRECTORY + ' ' + oldFilePath + ' ' + newFilePath;
      exec(command, function(error, stdout, stderr) {
        if(error) {
          d.reject(error.code);
          return;
        }

        console.log(stdout);

        d.resolve();
      });

      return d.promise();
    });
  }

  return {
    history: history,
    diff: diff
  };
};
