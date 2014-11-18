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
      $tableRow.append($('<td></td>').text('ファイル名'));
      $tableRow.append($('<td></td>').text('タグ'));
      $tableRow.append($('<td></td>').text('バージョン'));
      $tableRow.append($('<td></td>').text('コメント'));
      $tableRow.append($('<td></td>').text('ユーザー名'));
      $fileListTable.append($tableRow);

      data.forEach(function(fileInfo) {
        var $tableRow = $('<tr></tr>');

        var downloadLink = $('<a href=download/' + escape(fileInfo.name) + '/' + fileInfo.version + '></a>').text(fileInfo.name);

        $tableRow.append($('<td></td>').append(downloadLink));
        $tableRow.append($('<td></td>').append(createTagCell(fileInfo.name, fileInfo.tags)));
        $tableRow.append($('<td></td>').text(fileInfo.version));
        $tableRow.append($('<td></td>').text(fileInfo.comment));
        $tableRow.append($('<td></td>').text(fileInfo.user_name));

        $fileListTable.append($tableRow);
      });
    },
    'json')
    .error(function(error, errorMessage) {
      alert(errorMessage);
    });
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
      $.post('/tag_edit', { file_name: fileName })
        .done(function(data) {
          $(selecterIdInfos.tagEditDialog)
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
