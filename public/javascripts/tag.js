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

  var $tagCreateButton = $(selecterIdInfos.tagCreateButton);
  var $tagEditCurrentTagList = $(selecterIdInfos.tagEditCurrentTagList);
  console.log($tagEditCurrentTagList);
  $tagEditCurrentTagList.append(createTagLabel('aaa'));

  $tagCreateButton.on('click', function() {
    // 新しいタグをリストに追加する
    var newTagName = $(selecterIdInfos.tagCreateNameInput).val();
    if(newTagName !== '') {
      tagArray.push(newTagName);

      $tagEditCurrentTagList.append(createTagLabel(newTagName));
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
    return $('<span></span>').addClass('label label-default').html(tagName);
  }
};

