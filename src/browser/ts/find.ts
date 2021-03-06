/// <reference path="../../typings/lodash/lodash.d.ts" />

/**
 * @brief 検索関連処理
 */
import Tag = require('./tag');

/**
 * @brief 検索処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 */
export function setup(selecters) {
  var tagListArray = [
    selecters.$inclusionAllTagList,
    selecters.$inclusionAnyTagList,
    selecters.$exclusionTagList,
    selecters.$livingTagList
  ];

  selecters.$inclusionAllTagList.hintText = '必ず含むタグ';
  selecters.$inclusionAnyTagList.hintText = 'いずれかを含むタグ';
  selecters.$exclusionTagList.hintText = '除外するタグ';

  selecters.$findDialog.setup = function(findInfo) {
    selecters.$fileNamesText.val(findInfo.fileNames.join(','));
    selecters.$inclusionAllTagList.tagNames = findInfo.inclusionAllTagNames;
    selecters.$inclusionAnyTagList.tagNames = findInfo.inclusionAnyTagNames;
    selecters.$exclusionTagList.tagNames = findInfo.exclusionTagNames;
    selecters.$livingTagList.tagNames = findInfo.livingTagNames;

    updateTagLists();

    return this;
  };

  // 各タグの表示領域に、ドロップ設定を追加
  tagListArray.forEach(function($tagList) {
    Tag.setupDrppableTagList($tagList, function(droppedTagName) {
      $tagList.tagNames.push(droppedTagName);

      var otherTagLists = _.without(tagListArray, $tagList);
      otherTagLists.forEach(function($tagList) {
        $tagList.tagNames = _.without($tagList.tagNames, droppedTagName);
      });

      updateTagLists();
    });
  });

  function updateTagLists() {
    tagListArray.forEach(function($tagList) {
      Tag.updateTagList($tagList, 5);
    });
  }
};
