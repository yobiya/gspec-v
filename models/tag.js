/**
 * @brief コミット
 */
module.exports = function(mongoModels) {
  var _ = require('lodash');

  /**
   * @brief タグ編集用情報を取得する
   *
   * @param fileName 対象のファイル名
   * @param resultCallback 結果を渡すコールバック
   */
  function getTagEditInfo(fileName, resultCallback) {
    mongoModels.util.findLatestFileVersion(fileName, function(lastVersion, lastDocumentId) {
      if(lastVersion === 0) {
        resultCallback({ errorMessage: '対象のファイルは見つかりませんでした' });
        return;
      }

      mongoModels
        .commitInfo
        .findOne({ _id: lastDocumentId }, function(error, doc) {
          findAllLatestTagNames(function(tagNames) {
            var info = {
              file_tags: doc.tag_names,
              stock_tags: _.difference(tagNames, doc.tag_names)
            };

            resultCallback(info);
          });
        });
    });
  }

  /**
   * @brief タグの編集結果を適用する
   *
   * @param fileName 対象のファイル名
   * @param tagNames 適用するタグ名の配列
   * @param resultCallback 結果を渡すコールバック
   */
  function applyTagEditInfo(fileName, tagNames, resultCallback) {
    mongoModels.util.findLatestFileVersion(fileName, function(lastVersion, lastDocumentId) {
      if(lastVersion === 0) {
        resultCallback({ errorMessage: '対象のファイルは見つかりませんでした' });
        return;
      }

      mongoModels
        .commitInfo
        .findOneAndUpdate({ _id: lastDocumentId },
                          { tag_names: tagNames },
                          function(error, docs) {
                            if(error) {
                              throw error;
                            }

                            resultCallback({});
                          });
    });
  }

  /**
   * @brief 最新のコミット情報のタグを全て取得する
   *
   * @param resultCallback 結果を渡すコールバック
   */
  function findAllLatestTagNames(resultCallback) {
    mongoModels.latestCommitId.find({}, function(error, docs) {
      var commitDocIds = _.pluck(docs, function(doc) { return doc.commit_doc_id; });
      var findInfo = { _id: { $in: commitDocIds } };

      mongoModels.commitInfo.find(findInfo, function(error, docs) {
        if(error) {
          throw error;
        }

        var tagNames = _(docs)
                        .pluck('tag_names')
                        .flatten()
                        .uniq()
                        .value();

        resultCallback(tagNames);
      });
    });
  }

  return {
    getTagEditInfo: getTagEditInfo,
    applyTagEditInfo: applyTagEditInfo
  };
};
