/**
 * @brief ユーザー認証
 */
module.exports = function (mongoModels) {
    /**
     * @brief ログイン認証を行う
     *
     * @param userName ユーザー名
     * @param password パスワード
     * @param successCallback 成功時に呼ばれる関数
     * @param failCallback 失敗時に呼ばれる関数
     */
    function login(userName, password, successCallback, failCallback) {
        console.log("un : " + userName);
        console.log("pw : " + password);
        mongoModels.users.findOne({ name: userName, password: password }, function (error, userData) {
            if (error) {
                console.log(error);
                failCallback();
                return;
            }
            if (!userData) {
                // ユーザー情報は見つからなかった
                console.log('User info not found : ' + userData);
                failCallback();
                return;
            }
            // ユーザー情報が見つかった
            successCallback(userName);
        });
    }
    return {
        login: login
    };
};
