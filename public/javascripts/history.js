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
          if(data.response_code !== 0) {
            alert(data.message);
            return;
          }
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
      var rightHtml = convertViewHtml(newDiffHtml,
                                      [],
                                      diffInfoRightLineNumbers(diffInfo, 'c'),
                                      diffInfoRightLineNumbers(diffInfo, 'a'));

      var $leftDoc = $($this.find('#left_iframe')[0].contentDocument.documentElement);
      var $rightDoc = $($this.find('#right_iframe')[0].contentDocument.documentElement);
      $leftDoc.html(leftHtml);
      $rightDoc.html(rightHtml);

      setCss($leftDoc);
      setCss($rightDoc);

      return this;
    };
  }

  function splitLines(text) {
    return text.split(/\r\n|\r|\n/);
  }

  function setCss($doc) {
      $doc.find('td').css('white-space', 'nowrap');
      $doc.find('.diff_delete').css('border', '3px solid gray');
      $doc.find('.diff_change').css('border', '3px solid green');
      $doc.find('.diff_add').css('border', '3px solid red');
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

  /**
   * @brief 差分情報から右側の変更行番号を配列として返す
   */
  function diffInfoRightLineNumbers(diffInfo, typeChar) {
    var diffInfoList = splitLines(diffInfo);
    var result = [];

    // 削除された行情報
    diffInfoList.forEach(function(info) {
      var rangeInfo = new RegExp(typeChar + '([\\d,]+)').exec(info);
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

  function insertTagClassInDiffLines(textLines, lineNumbers, className) {
    lineNumbers.forEach(function(lineNumber) {
      var index = lineNumber - 1;
      var line = textLines[index];

      var topTagInfo = /^\s*<\w+ /.exec(line);
      if(!topTagInfo) {
        // もし、先頭のタグがなければ、何も行わない
        return;
      }

      var insertIndex = topTagInfo[0].length;
      textLines[index] = line.slice(0, insertIndex) + 'class="' + className + '" ' + line.slice(insertIndex);
    });

    return textLines;
  }

  function convertViewHtml(htmlText, deleteLineNumbers, changeLineNumbers, addLineNumbers) {
    var lines = splitLines(htmlText);

    // ヘッダは無視する
    (function() {
      var bodyLineIndex = 1 + _.findIndex(lines, function(line) {
        return /<body>/.test(line);
      });

      var outHeaderLine = function(number) {
        return number > bodyLineIndex;
      };
      deleteLineNumbers = _.filter(deleteLineNumbers, outHeaderLine);
      changeLineNumbers = _.filter(changeLineNumbers, outHeaderLine);
      addLineNumbers = _.filter(addLineNumbers, outHeaderLine);
    })();

    lines = insertTagClassInDiffLines(lines, deleteLineNumbers, 'diff_delete');
    lines = insertTagClassInDiffLines(lines, changeLineNumbers, 'diff_change');
    lines = insertTagClassInDiffLines(lines, addLineNumbers, 'diff_add');

    var result = '';
    lines.forEach(function(line) {
      result = result.concat(line);
    });

    return result;
  }

  return {
    setup: setup
  };
})();

