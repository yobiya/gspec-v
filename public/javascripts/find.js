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

  selecters.$findButton.on('click', function() {
    tagListArray.forEach(function(tagList) {
      tagList.tagNames = [];
    });

    $.post('/latest_tag_names', {})
      .done(function(tagNames) {
        selecters.$livingTagList.tagNames = tagNames;
        updateTagList();
        selecters.$findDialog.modal('show');
      })
      .fail(function(error, errorMessage) {
        alert(errorMessage);
      });
  });

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
