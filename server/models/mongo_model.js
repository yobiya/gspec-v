/// <reference path="../../../typings/mongoose/mongoose.d.ts" />
var MG = require('mongoose');
/**
 * @brief Mongooseのモデルへのアクセッサ
 */
var MongoModel = (function () {
    function MongoModel(_mongoose) {
        this._mongoose = _mongoose;
        var commitVersionSchema = { file_name: String, version: Number };
        var schemas = {
            userSchema: new MG.Schema({ name: String, password: String }),
            sessionSchema: new MG.Schema({ session: String, userObjectId: MG.Schema.Types.ObjectId }),
            commitInfo: new MG.Schema({ name: String, path: String, comment: String, tag_names: [String], version: Number, commit_time: Date, user_name: String }),
            latestCommitId: new MG.Schema({ commit_doc_id: MG.Schema.Types.ObjectId }),
            userLastViewCommitVersion: new MG.Schema({ user_name: String, last_views: [commitVersionSchema] })
        };
        this.users = _mongoose.model('users', schemas.userSchema);
        this.sessions = _mongoose.model('sessions', schemas.sessionSchema);
        this.commitInfo = _mongoose.model('commit_infos', schemas.commitInfo);
        this.latestCommitId = _mongoose.model('latest_commit_info_ids', schemas.latestCommitId);
        this.userLastViewCommitVersion = _mongoose.model('user_last_view_commit_version', schemas.userLastViewCommitVersion);
    }
    /**
     * @brief コミットされているファイルの最新のバージョン番号を検索する
     *
     * @param fileName ファイル名
     * @param successCallback 成功時に呼び出されるコールバック
     *
     * @todo 削除予定、findLatestFileCommitInfoを使用するように変更する
     */
    MongoModel.prototype.findLatestFileVersion = function (fileName, successCallback) {
        this.commitInfo.find({ name: fileName }).select('version').sort({ version: -1 }).limit(1).exec(function (error, docs) {
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
    };
    /**
     * @brief ファイルの最新のコミット情報を検索する
     *
     * @param fileName ファイル名
     * @param successCallback 成功時に呼び出されるコールバック
     */
    MongoModel.prototype.findLatestFileCommitInfo = function (fileName, successCallback) {
        this.commitInfo.find({ name: fileName }).sort({ version: -1 }).limit(1).exec(function (error, docs) {
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
    };
    return MongoModel;
})();
exports.MongoModel = MongoModel;
;
