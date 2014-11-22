/**
 * @brief タグ関連処理
 */
var gspecv = gspecv || {};
gspecv.tag = {};

/**
 * @brief タグ関連処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 * @param updateView 表示の更新関数
 */
gspecv.tag.setup = function(selecters, updateView) {
  var editFileName;
  var fileTagNameArray = [];
  var stockTagNameArray = [];

  // ダイアログのセットアップメソッドを設定
  selecters.$tagEditDialog.setup = function(fileName, data) {
    editFileName = fileName;
    fileTagNameArray = data.file_tags;

    // タグ情報を構築
    selecters.$fileTagList.droppable({
      drop: function(event, ui) {
        var $dropedSelecter = $(ui.draggable[0]);
        $dropedSelecter.remove();
        selecters.$fileTagList.append($dropedSelecter);
        $dropedSelecter.draggable({ revert: true });
      }
    });
    fileTagNameArray.forEach(function(tagName) {
      selecters.$fileTagList.append(gspecv.tag.createTagLabel(tagName));
    });

    stockTagNameArray.forEach(function(tagName) {
      selecters.$stockTagList.append(gspecv.tag.createTagLabel(tagName));
    });

    return selecters.$tagEditDialog;
  };

  selecters.$tagCreateButton.on('click', function() {
    // 新しいタグをリストに追加する
    var newTagName = $(selecters.tagCreateNameInput).val();
    if(newTagName !== '') {
      fileTagNameArray.push(newTagName);

      selecters.$fileTagList.append(gspecv.tag.createTagLabel(newTagName));
    }
  });

  // 編集したタグを適用する
  selecters.$applyTagButton.on('click', function() {
    var info = {
      file_name: editFileName,
      tag_names: fileTagNameArray
    };

    $.post('/apply_tag', info)
      .done(function(data) {
      })
      .fail(function(error, errorMessage) {
        alsert(errorMessage);
      });

    selecters.$tagEditDialog.modal('hide');

    // 表示を更新する
    updateView();
  });
};

/**
 * @brief タグのラベルを生成
 *
 * @param tagName タグ名
 *
 * @return タグのラベル
 */
gspecv.tag.createTagLabel = function createTagLabel(tagName) {
  return $('<span>')
          .addClass('label label-default')
          .draggable({ revert: true })
          .text(tagName);
};
