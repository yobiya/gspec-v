/// <reference path="../../typings/jquery/jquery.d.ts" />

declare var gspecv: any;
declare var $: JQueryStatic;

import Tag = require('./tag');
import CommitInfo = require('./commit_info');
import Commit = require('./commit');
import Find = require('./find');
import History = require('./history');
import UserView = require('./user_view');

$(function() {
  var $findDialog = $('#find_dialog');
  var $tagEditDialog = $('#tag_edit_dialog');
  var $userViewDialog = $('#user_view_dialog');
  var $historyDialog = $('#history_dialog');
  var $inclusionAllTagList = $('#inclusion_all_tag_list');
  var $inclusionAnyTagList = $('#inclusion_any_tag_list');
  var $exclusionTagList = $('#exclusion_tag_list');

  Find.setup({
    $findDialog: $findDialog,
    $fileNamesText: $('#find_dialog #file_names'),
    $inclusionAllTagList: $inclusionAllTagList,
    $inclusionAnyTagList: $inclusionAnyTagList,
    $exclusionTagList: $exclusionTagList,
    $livingTagList: $('.living_tag_list')
  });

  CommitInfo.setup({
    $findButton: $('#find_button'),
    $closeTabButton: $('#close_tab_button'),
    $commitInfoTabPanel: $('#commit_info_tabs .nav-tabs'),
    $commitInfoTBody: $('#commit_info tbody'),
    $findDialog: $findDialog,
    $tagEditDialog: $tagEditDialog,
    $userViewDialog: $userViewDialog,
    $historyDialog: $historyDialog,
    $inclusionAllTagList: $inclusionAllTagList,
    $inclusionAnyTagList: $inclusionAnyTagList,
    $exclusionTagList: $exclusionTagList,
  }, '#{user_name}');

  Tag.setup({
    tagCreateDialog: '#tag_create_dialog',
    $tagCreateButton: $('#tag_create_dialog #create_button'),
    tagCreateNameInput: '#tag_create_dialog #tag_name',
    $tagEditDialog: $tagEditDialog,
    $applyTagButton: $tagEditDialog.find('#apply_button'),
    $fileTagList: $('#tag_edit_dialog .left_tag_list'),
    $stockTagList: $('#tag_edit_dialog .right_tag_list')
  });

  History.setup({
    $dialog: $historyDialog,
    $infoTable: $('#history_dialog tbody'),
    $diffButton: $('#history_dialog #diff_button'),
    $diffDialog: $('#diff_dialog')
  });

  Commit.setup({
    $commitBox: $('#commit_box'),
    $uploadingDialog: $('#uploadingDialog')
  });

  UserView.setup({
    $dialog: $userViewDialog
  });
});

