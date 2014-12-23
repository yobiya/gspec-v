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
        function(data) {
          selecters.$diffDialog.setup(oldVersion, newVersion, data.old_diff_html, data.new_diff_html, data.diff_info).modal('show');
        }
      );
    });

    // 差分表示ダイアログのセットアップ処理
    selecters.$diffDialog.setup = function(oldVersion, newVersion, oldDiffHtml, newDiffHtml, diffInfo) {
      var $this = $(this);

      $this.find('#left_title').text(fileName + ' v' + oldVersion);
      $this.find('#right_title').text(fileName + ' v' + newVersion);

      var leftHtml = convertViewHtml(oldDiffHtml, 
                                      diffInfoLeftLineNumbers(diffInfo, 'd'),
                                      diffInfoLeftLineNumbers(diffInfo, 'c'),
                                      []);

      $this.find('#left_iframe')[0].contentDocument.documentElement.innerHTML = leftHtml;
      $this.find('#right_iframe')[0].contentDocument.documentElement.innerHTML = newDiffHtml;

      return this;
    };
  }

  function splitLines(text) {
    return text.split(/\r\n|\r|\n/);
  }

  /**
   * @brief 差分情報から左側の変更行番号を配列として返す
   */
  function diffInfoLeftLineNumbers(diffInfo, typeChar) {
    var diffInfoList = splitLines(diffInfo);
    var result = [];

    // 削除された行情報
    diffInfoList.forEach(function(info) {
      var rangeInfo = new RegExp('([\\d,]+)' + typeChar).exec(info);
      if(!rangeInfo) {
        return;
      }

      var range = rangeInfo[1];
      var multiLineInfo = /(\d+),(\d+)/.exec(range);

      var lineNumbers = [];
      if(multiLineInfo) {
        // カンマで区切られているので、複数行とみなす
        var begin = parseInt(multiLineInfo[1]);
        var end = parseInt(multiLineInfo[2]) + 1;
        result = result.concat(_.range(begin, end));
      } else {
        // カンマで区切られていないので、1行とみなす
        result.push(parseInt(range));
      }
    });

    return result;
  }

  function convertViewHtml(htmlText, deleteLineNumbers, changeLineNumbers, addLineNumbers) {
    var lines = splitLines(htmlText);

    // ヘッダは無視する
    var bodyLineIndex = _.findIndex(lines, function(line) {
      return /<body>/.test(line);
    });

    console.log(deleteLineNumbers);
    console.log(changeLineNumbers);
    console.log(addLineNumbers);

    return htmlText;
  }

  return {
    setup: setup
  };
})();

