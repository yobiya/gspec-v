/**
 * @brief Mongooseのモデルへのアクセッサ
 */
module.exports = function(mongoose) {
  var schemas = {
    commitInfo: mongoose.Schema({name: String, path: String, comment: String, tag_names: [String], version: Number, commit_time: Date, user_name: String}),
    latestCommitId: mongoose.Schema({ commit_doc_id: mongoose.Schema.Types.ObjectId }),
  };

  return {
    commitInfo: mongoose.model('commit_infos', schemas.commitInfo),
    latestCommitId: mongoose.model('latest_commit_info_ids', schemas.latestCommitId),
  };
};
