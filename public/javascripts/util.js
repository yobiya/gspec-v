/**
 * @brief ユーティリティ
 */
var gspecv = gspecv || {};

(function() {
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

  gspecv.util = {
    createIconText: createIconText
  };
})();
