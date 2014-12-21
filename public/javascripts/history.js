/**
 * @brief 履歴処理
 */
var gspecv = gspecv || {};

gspecv.history = (function() {
  var selecters;
  
  function setup(selecterObjects) {
    selecters = selecterObjects;

    // 履歴ダイアログにセットアップメソッドを追加
    selecters.$dialog.setup = function(historyInfoArray, isDiffSupport) {
      selecters.$infoTable.empty();

      // 差分に対応したフォーマットの場合は、差分表示を有効にする
      (function() {
        if(isDiffSupport) {
          selecters.$diffButton.removeAttr('disabled');
        } else {
          selecters.$diffButton.attr('disabled', 'disabled');
        }
      })();

      historyInfoArray.forEach(function(historyInfo) {
        var $tableRow = $('<tr>');

        gspecv.util.appendTableRowCell($tableRow,
                                        $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name),
                                        historyInfo.version,
                                        historyInfo.comment,
                                        historyInfo.user_name,
                                        historyInfo.commit_time);

        selecters.$infoTable.append($tableRow);
      });
   
      return selecters.$dialog;
    };
  }

  return {
    setup: setup
  };
})();

