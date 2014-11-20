/**
 * @brief 検索関連処理
 */
var gspecv = gspecv || {};

/**
 * @brief 検索処理のセットアップ
 *
 * @param $fileListTable ファイル一覧を表示するテーブルのセレクタ
 * @param $findDialog 検索用ダイアログのセレクタ
 * @param selecterIdInfos セレクタ用IDの情報
 *
 * return 検索関数
 */
gspecv.setupFind = function($fileListTable, $findDialog, selecterIdInfos) {
  function find(option) {
    $fileListTable.empty();

    $.post('find', option, function(data) {

      var $tableRow = $('<tr></tr>');
      appendTableRowCell($tableRow, 'ファイル名', 'タグ', 'バージョン', 'コメント', 'ユーザー名');
      $fileListTable.append($tableRow);

      data.forEach(function(fileInfo) {
        var $tableRow = $('<tr></tr>');

        appendTableRowCell($tableRow,
                          $('<a href=download/' + escape(fileInfo.name) + '/' + fileInfo.version + '></a>').text(fileInfo.name),
                          createTagCell(fileInfo.name, fileInfo.tags),
                          fileInfo.version,
                          fileInfo.comment,
                          fileInfo.user_name);

        $fileListTable.append($tableRow);
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
        $tableRow.append($('<td></td>').text(cellContent));
      } else {
        // 文字列以外なら、要素として追加
        $tableRow.append($('<td></td>').append(cellContent));
      }
    }
  }

  /**
   * @brief タグのセルを生成
   *
   * @param fileName ファイル名
   * @param tagNames タグ名の配列
   */
  function createTagCell(fileName, tagNames) {
    $cell = $('<div></div>');
    $editButton = $('<button></button>')
                    .addClass('glyphicon glyphicon-pencil')
                    .attr('data-toggle', 'modal')
                    .on('click', requestEditTagInfo);

    function requestEditTagInfo() {
      $.post('/edit_tag_info', { file_name: fileName })
        .done(function(data) {
          selecterIdInfos.$tagEditDialog
            .setup(fileName, data)
            .modal('show');
        })
        .fail(function(error, errorMessage) {
          alert(errorMessage);
        });
    }

    $cell.append($editButton);
/*    var tagNames = '';
    fileInfo.tags.forEach(function(tagName) {
      tagNames += tagName + ' ';
    });
    $tags.val(tagNames);
*/
    return $cell;
  }

  // 検索の実行
  $findDialog.find('#find_button').on('click', function() {
    var fileNames = $findDialog.find('#file_names').val();
    var fileNameArray = (fileNames === '') ? ([]) : (fileNames.split(','));

    find({
      file_names: fileNameArray
    });
  });

  // セットアップ時に、最新のファイルを検索する
  find();

  return find;
};
