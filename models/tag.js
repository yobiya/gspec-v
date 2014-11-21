/**
 * @brief コミット
 */
module.exports = function(mongoModels) {
  /**
   * @brief タグ編集用情報を取得する
   *
   * @param fileName 対象のファイル名
   * @param resultCallback 結果を渡すコールバック
   */
  function getTagEditInfo(fileName, resultCallback) {
    var info = {
      file_tags: [],
      stock_tags: []
    };

    resultCallback(info);
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

      mongoModels.commitInfo
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

  return {
    getTagEditInfo: getTagEditInfo,
    applyTagEditInfo: applyTagEditInfo
  };
};
