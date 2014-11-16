/**
 * @brief 検索関連処理
 */
var gspecv = gspecv || {};

/**
 * @brief 検索処理のセットアップ
 *
 * @param $fileListTable ファイル一覧を表示するテーブルのセレクタ
 * @param $findDialog 検索用ダイアログのセレクタ
 *
 * return 検索関数
 */
gspecv.setupFind = function($fileListTable, $findDialog) {
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
        var tags = '';
        fileInfo.tags.forEach(function(tag) {
          tags += tag + ' ';
        });

        $tableRow.append($('<td></td>').append(downloadLink));
        $tableRow.append($('<td></td>').text(tags));
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
