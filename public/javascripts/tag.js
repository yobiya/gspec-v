/**
 * @brief タグ関連処理
 */
var gspecv = gspecv || {};

/**
 * @brief タグ関連処理のセットアップ
 *
 * @param selecterIdInfos セレクタ用IDの情報
 */
gspecv.setupTag = function(selecterIdInfos) {
  var fileTagNameArray = [];
  var stockTagNameArray = [];

  var $tagCreateButton = $(selecterIdInfos.tagCreateButton);
  var $stockTagList = $(selecterIdInfos.stockTagList);

  $(selecterIdInfos.tagEditDialog).on('shown', function() {
    // タグ情報を構築
    var $fileTagList = $(selecterIdInfos.fileTagList);
    $fileTagList.droppable({
      drop: function(event, ui) {
        var $dropedSelecter = $(ui.draggable[0]);
        $dropedSelecter.remove();
        $fileTagList.append($dropedSelecter);
        $dropedSelecter.draggable({ revert: true });
      }
    });
    fileTagNameArray.forEach(function(tagName) {
      $fileTagList.append(createTagLabel(tagName));
    });

    stockTagNameArray.forEach(function(tagName) {
      $stockTagList.append(createTagLabel(tagName));
    });
  });

  $tagCreateButton.on('click', function() {
    // 新しいタグをリストに追加する
    var newTagName = $(selecterIdInfos.tagCreateNameInput).val();
    console.log(newTagName);
    if(newTagName !== '') {
      stockTagNameArray.push(newTagName);

      $stockTagList.append(createTagLabel(newTagName));
    }
  });

  /**
   * @brief タグのラベルを生成
   *
   * @param tagName タグ名
   *
   * @return タグのラベル
   */
  function createTagLabel(tagName) {
    return $('<span></span>')
            .addClass('label label-default')
            .draggable({ revert: true })
            .text(tagName);
  }
};

