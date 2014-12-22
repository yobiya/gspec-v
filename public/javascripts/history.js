/**
 * @brief 履歴処理
 */
var gspecv = gspecv || {};

gspecv.history = (function() {
  var selecters;
  var fileName;
  var diffCheckArray = [];
  
  function setup(selecterObjects) {
    selecters = selecterObjects;
    diffCheckArray = [];

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
        // ファイル名を保存しておく
        fileName = historyInfo.name;

        var $checkBox = $('<input type="checkbox">');

        diffCheckArray.push({ $checkBox: $checkBox, version: historyInfo.version });

        var $tableRow = $('<tr>');
        gspecv.util.appendTableRowCell($tableRow,
                                        $checkBox,
                                        $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name),
                                        historyInfo.version,
                                        historyInfo.comment,
                                        historyInfo.user_name,
                                        historyInfo.commit_time);

        selecters.$infoTable.append($tableRow);
      });
   
      return selecters.$dialog;
    };

    // 差分確認ボタンが押された
    selecters.$diffButton.on('click', function() {
      // チェックが2つ以上あることを確認

      var checkedVersions = _(diffCheckArray)
        .filter(function(diffCheck) {
          return (diffCheck.$checkBox.prop('checked'));
        })
        .pluck('version')
        .value();

      if(checkedVersions.length < 2) {
        alert('差分を確認する2つのバージョンを選んでください');
        return;
      }

      var oldVersion = _.min(checkedVersions);
      var newVersion = _.max(checkedVersions);
      
      gspecv.util.post(
        'diff',
        {
          file_name: fileName,
          old_version: oldVersion,
          new_version: newVersion
        },
        function() {
        }
      );
    });
  }

  return {
    setup: setup
  };
})();

