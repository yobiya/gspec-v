/**
 * @brief タグ関連処理
 */
var gspecv = gspecv || {};
gspecv.tag = {};

(function() {
  var fileTagNameArray = [];
  var stockTagNameArray = [];
  var selecters;

  /**
   * @brief タグ関連処理のセットアップ
   *
   * @param selecterObjects セレクタをまとめたオブジェクト
   */
  function setup(selecterObjects) {
    selecters = selecterObjects;
    var editFileName;

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
        fileTagNameArray.push(newTagName.trim());
        updateTagList();
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
  }

  /**
   * @brief タグのラベルを生成
   *
   * @param tagName タグ名
   *
   * @return タグのラベル
   */
  function createTagLabel(tagName) {
    return $('<span>')
            .addClass('label label-default tag')
            .draggable({ revert: true })
            .text(tagName);
  }

  function updateTagList() {
    // 既存のタグ情報を削除
    selecters.$fileTagList.find('.tag').remove();
    selecters.$fileTagList.find('br').remove();
    selecters.$stockTagList.find('.tag').remove();
    selecters.$stockTagList.find('br').remove();

    var fileRowTagCount = 0;
    fileTagNameArray.forEach(function(tagName) {
      selecters.$fileTagList.append(createTagLabel(tagName));
      fileRowTagCount++;
      if(fileRowTagCount >= 3) {
        selecters.$fileTagList.append('<br>');
        fileRowTagCount = 0;
      }
    });

    var stockRowTagCount = 0;
    stockTagNameArray.forEach(function(tagName) {
      selecters.$stockTagList.append(createTagLabel(tagName));
      stockRowTagCount++;
      if(stockRowTagCount >= 3) {
        selecters.$stockTagList.append('<br>');
        stockRowTagCount = 0;
      }
    });
  }

  // 外部に公開する関数を設定
  gspecv.tag.setup = setup;
  gspecv.tag.createTagLabel = createTagLabel;
})();
