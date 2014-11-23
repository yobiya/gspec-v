/**
 * @brief コミット情報処理
 */
var gspecv = gspecv || {};
gspecv.commitInfo = {};

/**
 * @brief コミット情報処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 *
 * return 検索関数
 */
gspecv.commitInfo.setup = function(selecters) {
  function find(option) {
    selecters.$commitInfoTable.empty();

    $.post('find', option, function(fileInfos) {
      fileInfos.forEach(function(fileInfo) {
        var $tableRow = $('<tr>');

        appendTableRowCell($tableRow,
                          createDropdownMenu(fileInfo),
                          $('<a href=download/' + fileInfo._id + '></a>').text(fileInfo.name),
                          createTagCell(fileInfo.tag_names),
                          fileInfo.version,
                          fileInfo.comment,
                          fileInfo.user_name);

        selecters.$commitInfoTable.append($tableRow);
      });
    },
    'json')
    .error(function(error, errorMessage) {
      alert(errorMessage);
    });
  }

  /**
   * @brief テーブルの行に複数のセルを追加する
   *
   * @param $tableRow テーブルの行
   * @param arguments 可変長引数で、追加するセルを受け取る
   */
  function appendTableRowCell($tableRow) {
    for(var i = 1; i < arguments.length; i++) {
      var cellContent = arguments[i];

      if(typeof cellContent === 'string') {
        // 文字列なら、テキストとして設定
        $tableRow.append($('<td>').text(cellContent));
      } else {
        // 文字列以外なら、要素として追加
        $tableRow.append($('<td>').append(cellContent));
      }
    }
  }

  /**
   * @brief ドロップダウンメニューを生成する
   *
   * @param fileInfo ファイル情報
   */
  function createDropdownMenu(fileInfo) {
    var $button = $('<a>').addClass('dropdown-toggle glyphicon glyphicon-th-list').attr('data-toggle', 'dropdown');
    $button.append($('<b>').addClass('caret'));

    var $history = $('<a>').addClass('glyphicon glyphicon-time')
                            .text(' 履歴')
                            .on('click', function() {
                              $.post('/history', { file_name: fileInfo.name })
                                .done(function(historyInfoArray) {
                                  selecters.$historyDialog.setup(historyInfoArray).modal('show');
                                })
                                .fail(function(error, errorMessage) {
                                  alert(errorMessage);
                                });
                            });
    var $tagEdit = $('<a>').addClass('glyphicon glyphicon-tags')
                            .text(' タグ編集')
                            .on('click', function() {
                              $.post('/edit_tag_info', { file_name: fileInfo.name })
                                .done(function(data) {
                                  selecters.$tagEditDialog
                                    .setup(fileInfo.name, data)
                                    .modal('show');
                                })
                                .fail(function(error, errorMessage) {
                                  alert(errorMessage);
                                });
                            });

    var $menuContents = $('<li>').addClass('dropdown-menu')
                                .append($('<li>').append($history))
                                .append($('<li>').append($tagEdit));

    var $menu = $('<div>').append($button).append($menuContents);
    return $('<div>').addClass('dropdown').append($menu);
  }

  /**
   * @brief タグのセルを生成
   *
   * @param tagNames タグ名の配列
   */
  function createTagCell(tagNames) {
    $cell = $('<div>');

    tagNames.forEach(function(name) {
      $cell.append(gspecv.tag.createTagLabel(name));
    });

    return $cell;
  }

  // 検索の実行
  selecters.$findDialog.find('#find_button').on('click', function() {
    var fileNames = selecters.$findDialog.find('#file_names').val();
    var fileNameArray = (fileNames === '') ? ([]) : (fileNames.split(','));

    find({
      file_names: fileNameArray,
      tags: {
        inclusion_all: [],
        inclusion_any: [],
        exclusion: []
      }
    });
  });

  // 履歴ダイアログにセットアップメソッドを追加
  selecters.$historyDialog.setup = function(historyInfoArray) {
    selecters.$historyInfoTable.empty();

    historyInfoArray.forEach(function(historyInfo) {
      var $tableRow = $('<tr>');

      appendTableRowCell($tableRow,
                        $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name),
                        historyInfo.version,
                        historyInfo.comment,
                        historyInfo.user_name);

      selecters.$historyInfoTable.append($tableRow);
    });
 

    return selecters.$historyDialog;
  };

  // セットアップ時に、最新のファイルを検索する
  find();

  return find;
};
