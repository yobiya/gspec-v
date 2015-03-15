/// <reference path="../../typings/jquery/jquery.d.ts" />

/**
 * @brief ユーティリティ
 */

/**
 * @brief POSTリクエストで、APIを呼び出す
 *
 * @param apiName API名
 * @param param リクエストパラメータ
 * @param successFunc 成功時に呼ばれる関数
 * @param errorFunc エラー時に呼ばれる関数（省略可能）
 *
 * @note エラー処理はダイアログが表示される
 */
export function post(apiName, param, successFunc, errorFunc) {
  errorFunc = errorFunc || function(error, errorMessage) { alert(errorMessage); };
  $.post('/' + apiName, param)
    .done(successFunc)
    .fail(errorFunc);
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
export function createIconText(iconName, text, color) {
  var iconCss = {
    'color': color,
    'float': 'left',
    'margin-right': '3px'
  };

  var textCss = {
    'color': color,
    'float': 'left'
  };

  var $icon = $('<div>').addClass('glyphicon glyphicon-' + iconName).css(iconCss);
  var $text = $('<div>').text(text).css(textCss);

  return $('<div>')
          .append($icon)
          .append($text);
}

/**
 * @brief テーブルの行に複数のセルを追加する
 *
 * @param $tableRow テーブルの行
 * @param arguments 可変長引数で、追加するセルを受け取る
 */
export function appendTableRowCell($tableRow, ...content: any[]) {
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
