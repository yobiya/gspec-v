/**
 * @brief Mongooseのモデルへのアクセッサ
 */
module.exports = function(mongoose) {
  var schemas = {
    commitInfo: mongoose.Schema({name: String, path: String, comment: String, tag_names: [String], version: Number, commit_time: Date, user_name: String}),
    latestCommitId: mongoose.Schema({ commit_doc_id: mongoose.Schema.Types.ObjectId }),
  };

  var commitInfo = mongoose.model('commit_infos', schemas.commitInfo);
  var latestCommitId = mongoose.model('latest_commit_info_ids', schemas.latestCommitId);

  /**
   * @brief コミットされているファイルの最新のバージョン番号を検索する
   *
   * @param fileName ファイル名
   * @param successCallback 成功時に呼び出されるコールバック
   */
  function findLatestFileVersion(fileName, successCallback) {
    commitInfo
      .find({ name: fileName })
      .select('version')
      .sort({ version: -1})
      .limit(1)
      .exec(function(error, docs) {
        if(error) {
          throw error;
        }

        if(docs.length > 0) {
          // コミットされているファイルは見つかった
          successCallback(docs[0].version, docs[0]._id);
        } else {
          // コミットされているファイルは見つからなかった
          successCallback(0);
        }
      });
  }

  return {
    commitInfo: commitInfo,
    latestCommitId: latestCommitId,
    util: {
      findLatestFileVersion: findLatestFileVersion
    }
  };
};
