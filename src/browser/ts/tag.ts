/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/requirejs/require.d.ts" />

/**
 * @brief タグ関連処理
 */
import Constant = require('./_common/constant');
import CommitInfo = require('./commit_info');
import Util = require('./util');

var selecters;

var TAG_NAME_ATTR = 'tag_prefix';
var TAG_NAME = Constant.TAG_NAME;

/**
 * @brief タグ関連処理のセットアップ
 *
 * @param selecterObjects セレクタをまとめたオブジェクト
 */
export function setup(selecterObjects) {
  selecters = selecterObjects;
  var editFileName;

  // ダイアログのセットアップメソッドを設定
  selecters.$tagEditDialog.setup = function(fileName, data) {
    editFileName = fileName;
    selecters.$fileTagList.tagNames = data.file_tags;
    selecters.$stockTagList.tagNames = data.stock_tags;

    // タグリストを構築
    setupDrppableTagList(selecters.$fileTagList, function(droppedTagName) {
      selecters.$fileTagList.tagNames.push(droppedTagName);
      selecters.$stockTagList.tagNames = _.without(selecters.$stockTagList.tagNames, droppedTagName);

      updateTagLists();
    });
    setupDrppableTagList(selecters.$stockTagList, function(droppedTagName) {
      selecters.$stockTagList.tagNames.push(droppedTagName);
      selecters.$fileTagList.tagNames = _.without(selecters.$fileTagList.tagNames, droppedTagName);

      updateTagLists();
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
          alert(data.errorMessage);
        }
      })
      .fail(function(error, errorMessage) {
        alert(errorMessage);
      });

    selecters.$tagEditDialog.modal('hide');

    // 表示を更新する
    CommitInfo.updateActiveTab();
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
export function createTagLabel(tagName, isDraggable) {
  var u = Util;

  var $label = $('<div>').addClass('tag label');
  if(isDraggable) {
    $label.draggable({ revert: true });
  }

  // プレフィックス別に処理を分ける
  var prefixRegExp = new RegExp('^[^:]+:');
  switch(prefixRegExp.exec(tagName)[0]) {
    case TAG_NAME.PREFIX.FREE:
      $label
        .addClass('tag-free')
        .attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.FREE)
        .text(tagName.substr(TAG_NAME.PREFIX.FREE.length));
      break;

    case TAG_NAME.PREFIX.PERSONAL:
      (function() {
        var userName = tagName.substr(TAG_NAME.PREFIX.PERSONAL.length);
        $label
          .addClass('tag-personal')
          .attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.PERSONAL)
          .append(u.createIconText('user', userName, 'black'));
      })();
      break;

    case TAG_NAME.PREFIX.EDIT:
      (function() {
        var userName = tagName.substr(TAG_NAME.PREFIX.EDIT.length);
        $label
          .addClass('tag-edit')
          .attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.EDIT)
          .append(u.createIconText('edit', userName, 'black'));
      })();
      break;

    case TAG_NAME.PREFIX.SYSTEM:
      if(tagName === TAG_NAME.CLOSED) {
        $label
          .addClass('tag-system')
          .attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.SYSTEM)
          .append(u.createIconText('ban-circle', 'closed', 'white'));
      } else {
        $label.addClass('tag-system').text(tagName);
      }
      break;

    default:
      $label.addClass('tag-system').text(tagName);
      break;
  }

  return $label;
}

/**
 * @brief タグのドロップを受け付けるタグリストを設定する
 *
 * @param $tagList タグリスト
 * @param droppedCollback ドロップされた場合に呼ばれるコールバック
 */
export function setupDrppableTagList($tagList, droppedCollback) {
  $tagList.droppable({
    drop: function(event, ui) {
      var $droppedTagLabel = $(ui.draggable[0]);
      var droppedTagName = $droppedTagLabel.attr('tag_prefix') + $droppedTagLabel.text();

      function isDroppedTagName(name) {
        return name === droppedTagName;
      }

      if(_.any($tagList.tagNames, isDroppedTagName)) {
        // 同じタグ名が既に存在していたら、何もしない
        return;
      }

      droppedCollback(droppedTagName);
    }
  });
}

function updateTagLists() {
  // 既存のタグ情報を削除
  updateTagList(selecters.$fileTagList, 4);
  updateTagList(selecters.$stockTagList, 4);
}

/**
 * @brief タグのリストを更新する
 *
 * @param $tagList 更新するタグのリスト
 * @param maxRowTagCount １行に表示するタグの最大数
 */
export function updateTagList($tagList, maxRowTagCount) {
  // タグリスト内の情報を削除
  // 削除したくない情報が含まれている場合があるので、emptyメソッドは使用しない
  $tagList.find('.tag').remove();
  $tagList.find('p').remove();

  // タグをリストに追加
  var rowTagCount = 0;
  $tagList.tagNames.forEach(function(tagName, index) {
    $tagList.append(createTagLabel(tagName, true));

    if(((index + 1) % maxRowTagCount) === 0) {
      // 指定数を超えたら改行
      $tagList.append('<p>');
    }
  });

  // タグが無い状態で、ヒントのテキストがあれば表示
  if(_.isEmpty($tagList.tagNames) && $tagList.hintText) {
    $tagList.append($('<p>').addClass('hint_text').text($tagList.hintText));
  }
}
