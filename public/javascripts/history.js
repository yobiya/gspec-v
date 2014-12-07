/**
 * @brief 履歴処理
 */
var gspecv = gspecv || {};

gspecv.history = (function() {
  var selecters;
  
  function setup(selecterObjects) {
    selecters = selecterObjects;

    // 履歴ダイアログにセットアップメソッドを追加
    selecters.$historyDialog.setup = function(historyInfoArray) {
      selecters.$historyInfoTable.empty();

      historyInfoArray.forEach(function(historyInfo) {
        var $tableRow = $('<tr>');

        gspecv.util.appendTableRowCell($tableRow,
                                        $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name),
                                        historyInfo.version,
                                        historyInfo.comment,
                                        historyInfo.user_name,
                                        historyInfo.commit_time);

        selecters.$historyInfoTable.append($tableRow);
      });
   
      return selecters.$historyDialog;
    };
  }

  return {
    setup: setup
  };
})();

