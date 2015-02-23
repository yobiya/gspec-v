/// <reference path="../../typings/jquery/jquery.d.ts" />
/**
 * @brief ユーザーのコミット確認状況処理
 */
var gspecv = gspecv || {};
gspecv.userView = (function () {
    function setup(selecters) {
        // ダイアログにセットアップメソッドを追加
        selecters.$dialog.setup = function (data) {
            var $tbody = selecters.$dialog.find('tbody');
            $tbody.empty();
            data.user_view_infos.forEach(function (info) {
                var $tableRow = $('<tr>');
                gspecv.util.appendTableRowCell($tableRow, info.user_name, data.file_latest_version - info.last_view_version);
                $tbody.append($tableRow);
            });
            return this;
        };
    }
    return {
        setup: setup
    };
})();
