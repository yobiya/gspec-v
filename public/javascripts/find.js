/**
 * @brief 検索関連処理
 */
var gspecv = gspecv || {};

/**
 * @brief 検索処理のセットアップ
 *
 * @param $fileListTable ファイル一覧を表示するテーブルのセレクタ
 *
 * return 検索関数
 */
gspecv.setupFind = function($fileListTable) {
  function find() {
    $fileListTable.empty();

    $.post('find', {}, function(data) {

      var $tableRow = $('<tr></tr>');
      $tableRow.append($('<td></td>').text('File name'));
      $tableRow.append($('<td></td>').text('Version'));
      $tableRow.append($('<td></td>').text('Comment'));
      $fileListTable.append($tableRow);

      data.forEach(function(fileInfo) {
        var $tableRow = $('<tr></tr>');

        var downloadLink = $('<a href=download/' + escape(fileInfo.name) + '></a>').text(fileInfo.name);
        $tableRow.append($('<td></td>').append(downloadLink));
        $tableRow.append($('<td></td>').text(fileInfo.version));
        $tableRow.append($('<td></td>').text(fileInfo.comment));

        $fileListTable.append($tableRow);
      });
    },
    'json')
    .error(function(error, errorMessage) {
      alert(errorMessage);
    });
  }

  // セットアップ時に、最新のファイルを検索する
  find();

  return find;
};
