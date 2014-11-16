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
  var tagArray = [];

  var $createTagButton = $(selecterIdInfos.createTagButton);

  $createTagButton.on('click', function() {
    // 新しいタグをリストに追加する
    var newTagName = $(selecterIdInfos.tagNameInput).val();
    if(newTagName !== '') {
      tagArray.push(newTagName);
    }
  });
};

