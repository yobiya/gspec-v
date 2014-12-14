/**
 * @brief ユーティリティ
 */
var gspecv = gspecv || {};

gspecv.util = (function() {

  /**
   * @brief POSTリクエストで、APIを呼び出す
   *
   * @param apiName API名
   * @param param リクエストパラメータ
   * @param successFunc 成功時に呼ばれる関数
   *
   * @note エラー処理はダイアログが表示される
   */
  function post(apiName, param, successFunc) {
    $.post('/' + apiName, param)
      .done(successFunc)
      .fail(function(error, errorMessage) {
        alert(errorMessage);
      });
  }

  /**
   * @brief アイコン付きテキストjQueryオブジェクトを生成する
   *
   * @param iconName アイコン名
   * @param text テキスト
   * @param color アイコンとテキストの色
   *
   * @return jQueryオブジェクト
   */
  function createIconText(iconName, text, color) {
    return $('<div>')
            .addClass('glyphicon glyphicon-' + iconName)
            .css({ color: color })
            .text(text);
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

  return {
    post: post,
    createIconText: createIconText,
    appendTableRowCell: appendTableRowCell
  };
})();
