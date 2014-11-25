/**
 * @brief タグ関連処理
 */
var gspecv = gspecv || {};
gspecv.tag = {};

(function() {
  var selecters;

  const TAG_PREFIX_SYSTEM = 'system:';
  const TAG_NAME = {
    PREFIX: {
      FREE: 'free:',
      SYSTEM: TAG_PREFIX_SYSTEM
    },
    CLOSED: TAG_PREFIX_SYSTEM + 'closed'
  };

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
      selecters.$fileTagList.tagNames = data.file_tags;
      selecters.$stockTagList.tagNames = data.stock_tags;

      // タグリストを構築
      selecters.$fileTagList.droppable({
        drop: function(event, ui) {
          var $droppedTagLabel = $(ui.draggable[0]);
          var droppedTagName = ($droppedTagLabel.attr('tag_prefix') || '') + $droppedTagLabel.text();

          function isDroppedTagName(name) {
            return name === droppedTagName;
          }

          if(_.any(selecters.$fileTagList.tagNames, isDroppedTagName)) {
            // 同じタグ名が既に存在していたら、何もしない
            return;
          }

          selecters.$fileTagList.tagNames.push(droppedTagName);
          selecters.$stockTagList.tagNames = _.remove(selecters.$stockTagList.tagNames, function(name) { return name !== droppedTagName; });

          updateTagLists();
        }
      });
      selecters.$stockTagList.droppable({
        drop: function(event, ui) {
          var $droppedTagLabel = $(ui.draggable[0]);
          var droppedTagName = $droppedTagLabel.attr('tag_prefix') + $droppedTagLabel.text();

          function isDroppedTagName(name) {
            return name === droppedTagName;
          }

          if(_.any(selecters.$stockTagList.tagNames, isDroppedTagName)) {
            // 同じタグ名が既に存在していたら、何もしない
            return;
          }

          selecters.$stockTagList.tagNames.push(droppedTagName);
          selecters.$fileTagList.tagNames = _.remove(selecters.$fileTagList.tagNames, function(name) { return name !== droppedTagName; });

          updateTagLists();
        }
      });

      updateTagLists();

      return selecters.$tagEditDialog;
    };

    selecters.$tagCreateButton.on('click', function() {
      // 新しいタグをリストに追加する
      var newTagName = $(selecters.tagCreateNameInput).val();
      if(newTagName !== '') {
        // ユーザーが作成したラベルはフリーラベルになる
        selecters.$fileTagList.tagNames.push(TAG_NAME.PREFIX.FREE + newTagName.trim());
        updateTagLists();
      }
    });

    // 編集したタグを適用する
    selecters.$applyTagButton.on('click', function() {
      var info = {
        file_name: editFileName,
        tag_names: selecters.$fileTagList.tagNames
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
   * @param isDraggable ドラッグの有効化フラグ
   *
   * @return タグのラベル
   */
  function createTagLabel(tagName, isDraggable) {
    $label = $('<span>').addClass('label tag');
    if(isDraggable) {
      $label.draggable({ revert: true });
    }

    // ラベル名のプレフィックス別に色とプレフィックを削除した名前を設定
    var viewTagName = tagName;
    if(RegExp('^' + TAG_NAME.PREFIX.FREE + '(.+)').test(tagName)) {
      $label.addClass('label-primary').attr('tag_prefix', TAG_NAME.PREFIX.FREE);
      viewTagName = tagName.substr(TAG_NAME.PREFIX.FREE.length);
    } else {
      $label.addClass('label-default');
    }

    $label.text(viewTagName);

    return $label;
  }

  function updateTagLists() {
    // 既存のタグ情報を削除
    updateTagList(selecters.$fileTagList, 3);
    updateTagList(selecters.$stockTagList, 3);
  }

  /**
   * @brief タグのリストを更新する
   *
   * @param $tagList 更新するタグのリスト
   * @param maxRowTagCount １行に表示するタグの最大数
   */
  function updateTagList($tagList, maxRowTagCount) {
    // タグリスト内の情報を削除
    // 削除したくない情報が含まれている場合があるので、emptyメソッドは使用しない
    $tagList.find('.tag').remove();
    $tagList.find('br').remove();
    $tagList.find('p').remove();

    // タグをリストに追加
    var rowTagCount = 0;
    $tagList.tagNames.forEach(function(tagName) {
      $tagList.append(createTagLabel(tagName, true));
      rowTagCount++;
      if(rowTagCount >= maxRowTagCount) {
        // 指定数を超えたら改行
        $tagList.append('<br>');
        rowTagCount = 0;
      }
    });

    // タグが無い状態で、ヒントのテキストがあれば表示
    if($tagList.tagNames.length === 0 && $tagList.hintText) {
      $tagList.append($('<p>').addClass('hint_text').text($tagList.hintText));
    }
  }

  // 外部に公開する関数を設定
  gspecv.tag.setup = setup;
  gspecv.tag.createTagLabel = createTagLabel;
  gspecv.tag.updateTagList = updateTagList;
})();
