/**
 * @brief タグ関連処理
 */
var gspecv = gspecv || {};
gspecv.tag = {};

/**
 * @brief タグ関連処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 */
gspecv.tag.setup = function(selecters) {
  var editFileName;
  var fileTagNameArray = [];
  var stockTagNameArray = [];

  function updateTagList() {
    // 既存のタグ情報を削除
    selecters.$fileTagList.find('.tag').remove();
    selecters.$stockTagList.find('.tag').remove();

    fileTagNameArray.forEach(function(tagName) {
      selecters.$fileTagList.append(gspecv.tag.createTagLabel(tagName));
    });

    stockTagNameArray.forEach(function(tagName) {
      selecters.$stockTagList.append(gspecv.tag.createTagLabel(tagName));
    });
  }

  // ダイアログのセットアップメソッドを設定
  selecters.$tagEditDialog.setup = function(fileName, data) {
    editFileName = fileName;
    fileTagNameArray = data.file_tags;
    stockTagNameArray = data.stock_tags;

    // タグリストを構築
    selecters.$fileTagList.droppable({
      drop: function(event, ui) {
        var $dropedSelecter = $(ui.draggable[0]);
        var droppedTagName = $dropedSelecter.text();
        fileTagNameArray.push(droppedTagName);
        stockTagNameArray = _.remove(stockTagNameArray, function(name) { return name !== droppedTagName; });

        updateTagList();
      }
    });
    selecters.$stockTagList.droppable({
      drop: function(event, ui) {
        var $dropedSelecter = $(ui.draggable[0]);
        var droppedTagName = $dropedSelecter.text();
        stockTagNameArray.push(droppedTagName);
        fileTagNameArray = _.remove(fileTagNameArray, function(name) { return name !== droppedTagName; });

        updateTagList();
      }
    });

    updateTagList();

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
        if(data.errorMessage) {
          alsert(data.errorMessage);
        }
      })
      .fail(function(error, errorMessage) {
        alsert(errorMessage);
      });

    selecters.$tagEditDialog.modal('hide');

    // 表示を更新する
    gspecv.commitInfo.updateActiveTab();
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
          .addClass('label label-default tag')
          .draggable({ revert: true })
          .text(tagName);
};
