/**
 * @brief 検索関連処理
 */
var gspecv = gspecv || {};
gspecv.find = {};

/**
 * @brief 検索処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 */
gspecv.find.setup = function(selecters) {
  var tagListArray = [
    selecters.$inclusionAllTagList,
    selecters.$inclusionAnyTagList,
    selecters.$exclusionTagList,
    selecters.$livingTagList
  ];

  selecters.$findDialog.setup = function(findInfo) {
    selecters.$inclusionAllTagList.tagNames = findInfo.inclusionAllTagNames;
    selecters.$inclusionAnyTagList.tagNames = findInfo.inclusionAnyTagNames;
    selecters.$exclusionTagList.tagNames = findInfo.exclusionTagNames;
    selecters.$livingTagList.tagNames = findInfo.livingTagNames;

    updateTagList();

    return this;
  };

  // 各タグの表示領域に、ドロップ設定を追加
  tagListArray.forEach(function(tagList) {
    tagList.droppable({
      drop: function(event, ui) {
        var $dropedSelecter = $(ui.draggable[0]);
        var droppedTagName = $dropedSelecter.text();

        tagList.tagNames.push(droppedTagName);
        _(tagListArray)
          .reject(function(other) { return other === tagList; })
          .each(function(other) {
            other.tagNames = _.remove(other.tagNames, function(name) { return name !== droppedTagName; });
          });

        updateTagList();
      }
    });
  });

  function updateTagList() {
    tagListArray.forEach(function(tagList) {
      tagList.empty();

      tagList.tagNames.forEach(function(name) {
        tagList.append(gspecv.tag.createTagLabel(name));
      });
    });
  }
};
