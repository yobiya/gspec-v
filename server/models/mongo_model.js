/**
 * @brief Mongooseのモデルへのアクセッサ
 */
module.exports = function (mongoose) {
    var commitVersionSchema = { file_name: String, version: Number };
    var schemas = {
        userSchema: mongoose.Schema({ name: String, password: String }),
        sessionSchema: mongoose.Schema({ session: String, userObjectId: mongoose.Schema.Types.ObjectId }),
        commitInfo: mongoose.Schema({ name: String, path: String, comment: String, tag_names: [String], version: Number, commit_time: Date, user_name: String }),
        latestCommitId: mongoose.Schema({ commit_doc_id: mongoose.Schema.Types.ObjectId }),
        userLastViewCommitVersion: mongoose.Schema({ user_name: String, last_views: [commitVersionSchema] })
    };
    var users = mongoose.model('users', schemas.userSchema);
    var sessions = mongoose.model('sessions', schemas.sessionSchema);
    var commitInfo = mongoose.model('commit_infos', schemas.commitInfo);
    var latestCommitId = mongoose.model('latest_commit_info_ids', schemas.latestCommitId);
    var userLastViewCommitVersion = mongoose.model('user_last_view_commit_version', schemas.userLastViewCommitVersion);
    /**
     * @brief コミットされているファイルの最新のバージョン番号を検索する
     *
     * @param fileName ファイル名
     * @param successCallback 成功時に呼び出されるコールバック
     *
     * @todo 削除予定、findLatestFileCommitInfoを使用するように変更する
     */
    function findLatestFileVersion(fileName, successCallback) {
        commitInfo.find({ name: fileName }).select('version').sort({ version: -1 }).limit(1).exec(function (error, docs) {
            if (error) {
                throw error;
            }
            if (docs.length > 0) {
                // コミットされているファイルは見つかった
                successCallback(docs[0].version, docs[0]._id);
            }
            else {
                // コミットされているファイルは見つからなかった
                successCallback(0);
            }
        });
    }
    /**
     * @brief ファイルの最新のコミット情報を検索する
     *
     * @param fileName ファイル名
     * @param successCallback 成功時に呼び出されるコールバック
     */
    function findLatestFileCommitInfo(fileName, successCallback) {
        commitInfo.find({ name: fileName }).sort({ version: -1 }).limit(1).exec(function (error, docs) {
            if (error) {
                throw error;
            }
            if (docs.length > 0) {
                // コミットされているファイルは見つかった
                successCallback(docs[0]);
            }
            else {
                // コミットされているファイルは見つからなかった
                successCallback(null);
            }
        });
    }
    return {
        users: users,
        sessions: sessions,
        commitInfo: commitInfo,
        latestCommitId: latestCommitId,
        userLastViewCommitVersion: userLastViewCommitVersion,
        util: {
            findLatestFileVersion: findLatestFileVersion,
            findLatestFileCommitInfo: findLatestFileCommitInfo
        }
    };
};
