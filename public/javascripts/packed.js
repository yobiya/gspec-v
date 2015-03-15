/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	var Tag = __webpack_require__(1);
	var CommitInfo = __webpack_require__(2);
	var Commit = __webpack_require__(3);
	var Find = __webpack_require__(4);
	var History = __webpack_require__(5);
	var UserView = __webpack_require__(6);
	$(function () {
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/// <reference path="../../typings/jqueryui/jqueryui.d.ts" />
	/// <reference path="../../typings/lodash/lodash.d.ts" />
	/// <reference path="../../typings/requirejs/require.d.ts" />
	/**
	 * @brief タグ関連処理
	 */
	var Constant = __webpack_require__(7);
	var CommitInfo = __webpack_require__(2);
	var Util = __webpack_require__(8);
	var selecters;
	var TAG_NAME_ATTR = 'tag_prefix';
	var TAG_NAME = Constant.TAG_NAME;
	/**
	 * @brief タグ関連処理のセットアップ
	 *
	 * @param selecterObjects セレクタをまとめたオブジェクト
	 */
	function setup(selecterObjects) {
	    selecters = selecterObjects;
	    var editFileName;
	    // ダイアログのセットアップメソッドを設定
	    selecters.$tagEditDialog.setup = function (fileName, data) {
	        editFileName = fileName;
	        selecters.$fileTagList.tagNames = data.file_tags;
	        selecters.$stockTagList.tagNames = data.stock_tags;
	        // タグリストを構築
	        setupDrppableTagList(selecters.$fileTagList, function (droppedTagName) {
	            selecters.$fileTagList.tagNames.push(droppedTagName);
	            selecters.$stockTagList.tagNames = _.without(selecters.$stockTagList.tagNames, droppedTagName);
	            updateTagLists();
	        });
	        setupDrppableTagList(selecters.$stockTagList, function (droppedTagName) {
	            selecters.$stockTagList.tagNames.push(droppedTagName);
	            selecters.$fileTagList.tagNames = _.without(selecters.$fileTagList.tagNames, droppedTagName);
	            updateTagLists();
	        });
	        updateTagLists();
	        return selecters.$tagEditDialog;
	    };
	    selecters.$tagCreateButton.on('click', function () {
	        // 新しいタグをリストに追加する
	        var newTagName = $(selecters.tagCreateNameInput).val();
	        if (newTagName !== '') {
	            // ユーザーが作成したラベルはフリーラベルになる
	            selecters.$fileTagList.tagNames.push(TAG_NAME.PREFIX.FREE + newTagName.trim());
	            updateTagLists();
	        }
	    });
	    // 編集したタグを適用する
	    selecters.$applyTagButton.on('click', function () {
	        var info = {
	            file_name: editFileName,
	            tag_names: selecters.$fileTagList.tagNames
	        };
	        $.post('/apply_tag', info).done(function (data) {
	            if (data.errorMessage) {
	                alert(data.errorMessage);
	            }
	        }).fail(function (error, errorMessage) {
	            alert(errorMessage);
	        });
	        selecters.$tagEditDialog.modal('hide');
	        // 表示を更新する
	        CommitInfo.updateActiveTab();
	    });
	}
	exports.setup = setup;
	/**
	 * @brief タグのラベルを生成
	 *
	 * @param tagName タグ名
	 * @param isDraggable ドラッグの有効化フラグ
	 *
	 * @return タグのラベル
	 */
	function createTagLabel(tagName, isDraggable) {
	    var u = Util;
	    var $label = $('<div>').addClass('tag label');
	    if (isDraggable) {
	        $label.draggable({ revert: true });
	    }
	    // プレフィックス別に処理を分ける
	    var prefixRegExp = new RegExp('^[^:]+:');
	    switch (prefixRegExp.exec(tagName)[0]) {
	        case TAG_NAME.PREFIX.FREE:
	            $label.addClass('tag-free').attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.FREE).text(tagName.substr(TAG_NAME.PREFIX.FREE.length));
	            break;
	        case TAG_NAME.PREFIX.PERSONAL:
	            (function () {
	                var userName = tagName.substr(TAG_NAME.PREFIX.PERSONAL.length);
	                $label.addClass('tag-personal').attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.PERSONAL).append(u.createIconText('user', userName, 'black'));
	            })();
	            break;
	        case TAG_NAME.PREFIX.EDIT:
	            (function () {
	                var userName = tagName.substr(TAG_NAME.PREFIX.EDIT.length);
	                $label.addClass('tag-edit').attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.EDIT).append(u.createIconText('edit', userName, 'black'));
	            })();
	            break;
	        case TAG_NAME.PREFIX.SYSTEM:
	            if (tagName === TAG_NAME.CLOSED) {
	                $label.addClass('tag-system').attr(TAG_NAME_ATTR, TAG_NAME.PREFIX.SYSTEM).append(u.createIconText('ban-circle', 'closed', 'white'));
	            }
	            else {
	                $label.addClass('tag-system').text(tagName);
	            }
	            break;
	        default:
	            $label.addClass('tag-system').text(tagName);
	            break;
	    }
	    return $label;
	}
	exports.createTagLabel = createTagLabel;
	/**
	 * @brief タグのドロップを受け付けるタグリストを設定する
	 *
	 * @param $tagList タグリスト
	 * @param droppedCollback ドロップされた場合に呼ばれるコールバック
	 */
	function setupDrppableTagList($tagList, droppedCollback) {
	    $tagList.droppable({
	        drop: function (event, ui) {
	            var $droppedTagLabel = $(ui.draggable[0]);
	            var droppedTagName = $droppedTagLabel.attr('tag_prefix') + $droppedTagLabel.text();
	            function isDroppedTagName(name) {
	                return name === droppedTagName;
	            }
	            if (_.any($tagList.tagNames, isDroppedTagName)) {
	                // 同じタグ名が既に存在していたら、何もしない
	                return;
	            }
	            droppedCollback(droppedTagName);
	        }
	    });
	}
	exports.setupDrppableTagList = setupDrppableTagList;
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
	function updateTagList($tagList, maxRowTagCount) {
	    // タグリスト内の情報を削除
	    // 削除したくない情報が含まれている場合があるので、emptyメソッドは使用しない
	    $tagList.find('.tag').remove();
	    $tagList.find('p').remove();
	    // タグをリストに追加
	    var rowTagCount = 0;
	    $tagList.tagNames.forEach(function (tagName, index) {
	        $tagList.append(createTagLabel(tagName, true));
	        if (((index + 1) % maxRowTagCount) === 0) {
	            // 指定数を超えたら改行
	            $tagList.append('<p>');
	        }
	    });
	    // タグが無い状態で、ヒントのテキストがあれば表示
	    if (_.isEmpty($tagList.tagNames) && $tagList.hintText) {
	        $tagList.append($('<p>').addClass('hint_text').text($tagList.hintText));
	    }
	}
	exports.updateTagList = updateTagList;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/// <reference path="../../typings/lodash/lodash.d.ts" />
	/**
	 * @brief コミット情報処理
	 */
	var Constant = __webpack_require__(7);
	var Tag = __webpack_require__(1);
	var Util = __webpack_require__(8);
	var UPDATE_INTERVAL = 30 * 1000; // 30秒
	var DEFAULT_TAB_NAME = 'All';
	var TAB_CLASS_NAME = 'find_tab';
	var $activeTab;
	var tabIdCounter = 0;
	var selecters;
	var userName;
	function find(option) {
	    // 編集中タグを追加する
	    function addEditTag(fileInfo) {
	        (function () {
	            var d = $.Deferred();
	            // 最新のタグ情報を取得
	            $.post('/edit_tag_info', { file_name: fileInfo.name }).done(function (data) {
	                d.resolve(data.file_tags);
	            }).fail(function (error, errorMessage) {
	                d.reject(errorMessage);
	            });
	            return d.promise();
	        })().then(function (tagNames) {
	            var d = $.Deferred();
	            var userEditTagName = Constant.TAG_NAME.PREFIX.EDIT + userName;
	            var otherUserEditTagName = _.find(tagNames, function (tagName) {
	                // 自分以外の編集中タグ名ならtrueを返す
	                if (tagName === userEditTagName) {
	                    return false;
	                }
	                return new RegExp("^" + Constant.TAG_NAME.PREFIX.EDIT).test(tagName);
	            });
	            if (otherUserEditTagName) {
	                var otherUserName = otherUserEditTagName.substr(Constant.TAG_NAME.PREFIX.EDIT.length);
	                console.log(otherUserName);
	                d.reject(otherUserName + " が編集中なので、" + userName + " 編集中タグを追加できませんでした");
	                return d.promise();
	            }
	            // 編集中タグを追加する
	            var editTagNames = [Constant.TAG_NAME.PREFIX.EDIT + userName];
	            Util.post('add_tag', { commit_document_id: fileInfo._id, tag_names: editTagNames }, function (data) {
	                updateActiveTab();
	                d.resolve();
	            }, function (error, errorMessage) {
	                d.reject(errorMessage);
	            });
	            return d.promise();
	        }).fail(function (errorMessage) {
	            alert(errorMessage);
	        });
	    }
	    $activeTab.find('a').text(changeTagName(option));
	    saveTabFindInfo($activeTab);
	    $.post('find', option, function (fileInfos) {
	        selecters.$commitInfoTBody.empty();
	        fileInfos.forEach(function (fileInfo) {
	            var $tableRow = $('<tr>');
	            var notViewVersionCount = fileInfo.version - fileInfo.user_last_view_version;
	            var $editAndFileDownload = $('<a>').attr('href', 'download/' + fileInfo._id).append('<div class="glyphicon glyphicon-edit">').on('click', function () {
	                // ダウンロードしたファイルが確認済みのファイルになったので
	                // 未確認のコミットファイルの数を非表示にする
	                $tableRow.find('td')[1].innerText = '';
	                // 編集中タグを追加する
	                addEditTag(fileInfo);
	            });
	            var $downloadFileName = $('<a>').attr('href', 'download/' + fileInfo._id).text(fileInfo.name).on('click', function () {
	                // ダウンロードしたファイルが確認済みのファイルになったので
	                // 未確認のコミットファイルの数を非表示にする
	                $tableRow.find('td')[1].innerText = '';
	            });
	            Util.appendTableRowCell($tableRow, createDropdownMenu(fileInfo), notViewVersionCount || '', $editAndFileDownload, $downloadFileName, createTagCell(fileInfo.tag_names), fileInfo.version, fileInfo.comment, fileInfo.commit_user_name, fileInfo.commit_time);
	            selecters.$commitInfoTBody.append($tableRow);
	        });
	    }, 'json').fail(function (error, errorMessage) {
	        alert(errorMessage);
	    });
	}
	// 検索条件に合ったタグ名を取得する
	function changeTagName(findInfo) {
	    // 検索条件を一つの配列とする
	    var findValueArray = (findInfo.file_names || []).concat(findInfo.inclusion_all_tag_names || []).concat(findInfo.inclusion_any_tag_names || []).concat(findInfo.exclusion_tag_names || []);
	    var headName = findValueArray[0];
	    if (headName) {
	        // 先頭の要素があれば、プレフィックスを除いた名前を返す
	        return headName.match('[^:]+$');
	    }
	    return DEFAULT_TAB_NAME;
	}
	/**
	 * @brief ドロップダウンメニューを生成する
	 *
	 * @param fileInfo ファイル情報
	 */
	function createDropdownMenu(fileInfo) {
	    var $button = $('<a>').addClass('dropdown-toggle glyphicon glyphicon-th-list').attr('data-toggle', 'dropdown');
	    $button.append($('<b>').addClass('caret'));
	    var $history = $('<a>').addClass('glyphicon glyphicon-time').text(' 履歴').on('click', function () {
	        $.post('/history', { file_name: fileInfo.name }).done(function (historyInfo) {
	            selecters.$historyDialog.setup(historyInfo.info_array, historyInfo.diff_support).modal('show');
	        }).fail(function (error, errorMessage) {
	            alert(errorMessage);
	        });
	    });
	    var $tagEdit = $('<a>').addClass('glyphicon glyphicon-tags').text(' タグ編集').on('click', function () {
	        $.post('/edit_tag_info', { file_name: fileInfo.name }).done(function (data) {
	            selecters.$tagEditDialog.setup(fileInfo.name, data).modal('show');
	        }).fail(function (error, errorMessage) {
	            alert(errorMessage);
	        });
	    });
	    var $usersView = $('<a>').addClass('glyphicon glyphicon-eye-open').text(' ユーザーの確認状況').on('click', function () {
	        $.post('/users_view_info', { file_name: fileInfo.name }).done(function (data) {
	            selecters.$userViewDialog.setup(data).modal('show');
	        }).fail(function (error, errorMessage) {
	            alert(errorMessage);
	        });
	    });
	    var $removeFile = $('<a>').addClass('glyphicon glyphicon-trash').text(' 削除').on('click', function () {
	        /*                      $.post('/users_view_info', { file_name: fileInfo.name })
	                              .done(function(data) {
	                                selecters.$userViewDialog.setup(data).modal('show');
	                              })
	                              .fail(function(error, errorMessage) {
	                                alert(errorMessage);
	                              });*/
	    });
	    var $menuContents = $('<li>').addClass('dropdown-menu').append($('<li>').append($history)).append($('<li>').append($tagEdit)).append($('<li>').append($usersView)).append($('<li>').append('<a><hr/></a>')).append($('<li>').append($removeFile));
	    var $menu = $('<div>').append($button).append($menuContents);
	    return $('<div>').addClass('dropdown').append($menu);
	}
	/**
	 * @brief タグのセルを生成
	 *
	 * @param tagNames タグ名の配列
	 */
	function createTagCell(tagNames) {
	    var $cell = $('<div>');
	    tagNames = _.sortBy(tagNames, function (tagName) {
	        var prefixRegExp = new RegExp('^[^:]+:');
	        switch (prefixRegExp.exec(tagName)[0]) {
	            case 'system:': return 0;
	            case 'edit:': return 1;
	            case 'personal:': return 2;
	            case 'free:': return 3;
	        }
	        return 5;
	    });
	    tagNames.forEach(function (name) {
	        $cell.append(Tag.createTagLabel(name, false));
	    });
	    return $cell;
	}
	/**
	 * @brief タブの検索情報を保存する
	 *
	 * @param $tab 保存するタブのjQueryオブジェクト
	 */
	function saveTabFindInfo($tab) {
	    localStorage['find_infos_' + $tab.tabId] = JSON.stringify($tab.findInfo);
	}
	/**
	 * @brief タブの検索情報を取得する
	 *
	 * @return 検索情報の配列
	 */
	function loadTabFindInfoArray() {
	    return _(Object.keys(localStorage)).filter(function (value) {
	        return /^find_infos_/.test(value);
	    }).map(function (key) {
	        return localStorage[key];
	    }).value();
	}
	/**
	 * @brief 保存されているタブの検索情報を削除する
	 *
	 * @param $tab 削除するタブのjQueryオブジェクト
	 */
	function removeTabFindInfo($tab) {
	    delete localStorage['find_infos_' + $tab.tabId];
	}
	/**
	 * @brief 保存されているタブの検索情報を全て削除する
	 */
	function removeTabFindInfoAll() {
	    var findInfoKeys = _(Object.keys(localStorage)).filter(function (value) {
	        return /^find_infos_/.test(value);
	    });
	    findInfoKeys.forEach(function (key) {
	        delete localStorage[key];
	    });
	}
	/**
	 * @brief コミット情報処理のセットアップ
	 *
	 * @param selecterObjects セレクタをまとめたオブジェクト
	 * @param userAccountName ユーザー名
	 */
	function setup(selecterObjects, userAccountName) {
	    selecters = selecterObjects;
	    userName = userAccountName;
	    // 検索の実行
	    selecters.$findDialog.find('#find_button').on('click', function () {
	        var fileNames = selecters.$findDialog.find('#file_names').val();
	        $activeTab.findInfo = {
	            file_names: _.compact(fileNames.split(',')),
	            inclusion_all_tag_names: selecters.$inclusionAllTagList.tagNames,
	            inclusion_any_tag_names: selecters.$inclusionAnyTagList.tagNames,
	            exclusion_tag_names: selecters.$exclusionTagList.tagNames
	        };
	        find($activeTab.findInfo);
	    });
	    // 検索ボタンの動作を設定
	    selecters.$findButton.on('click', function () {
	        // 最新のコミットで使用されているタグ名一覧を取得する
	        $.post('/latest_tag_names', {}).done(function (tagNames) {
	            var livingTagNames = _(tagNames).difference($activeTab.findInfo.inclusion_all_tag_names).difference($activeTab.findInfo.inclusion_any_tag_names).difference($activeTab.findInfo.exclusion_tag_names).value();
	            var findInfo = {
	                fileNames: $activeTab.findInfo.file_names || [],
	                inclusionAllTagNames: $activeTab.findInfo.inclusion_all_tag_names || [],
	                inclusionAnyTagNames: $activeTab.findInfo.inclusion_any_tag_names || [],
	                exclusionTagNames: $activeTab.findInfo.exclusion_tag_names || [],
	                livingTagNames: livingTagNames
	            };
	            selecters.$findDialog.setup(findInfo).modal('show');
	        }).fail(function (error, errorMessage) {
	            alert(errorMessage);
	        });
	    });
	    // タブを閉じるボタンの動作を設定
	    selecters.$closeTabButton.on('click', function () {
	        if (loadTabFindInfoArray().length <= 1) {
	            // 最後のタブは削除できないようにする
	            return;
	        }
	        removeTabFindInfo($activeTab);
	        $activeTab.remove();
	    });
	    /**
	     * @brief タブを生成する
	     *
	     * @param tabName 表示するタブ名
	     *
	     * @return タブのjQueryオブジェクト
	     */
	    function createTab(tabName) {
	        var $tabName = $('<a>').attr('role', "tab").attr('data-toggle', "tab").text(tabName);
	        var $tab = $('<li>').attr('role', 'presentation').addClass(TAB_CLASS_NAME).append($tabName);
	        $tab['findInfo'] = {};
	        $tab['tabId'] = tabIdCounter;
	        tabIdCounter++;
	        $tab.on('shown.bs.tab', function () {
	            setActiveTab($tab);
	        });
	        return $tab;
	    }
	    /**
	     * @brief タブをアクティブにする
	     *
	     * @param $tab タブ
	     */
	    function setActiveTab($tab) {
	        $activeTab = $tab;
	        var findInfo = $activeTab.findInfo || {};
	        find(findInfo);
	    }
	    /**
	     * @brief タブの追加ボタンを生成する
	     *
	     * @return タブの追加ボタン
	     */
	    function createAddTabButton() {
	        var $plus = $('<a>').addClass('glyphicon glyphicon-plus').attr('role', 'tab');
	        var $addButton = $('<li>').attr('role', 'presentation').append($plus);
	        $addButton.on('click', function () {
	            $addButton.before(createTab(DEFAULT_TAB_NAME));
	        });
	        selecters.$commitInfoTabPanel.append($addButton);
	    }
	    // 画面サイズに合わせて、コミット情報の表示領域を変更する
	    $(window).on('load resize', function () {
	        $('.commit_info_table').height($(window).height() - 310);
	    });
	    (function () {
	        var findInfos = loadTabFindInfoArray();
	        if (findInfos.length === 0) {
	            // 最初のタブを追加
	            var $tab = createTab(DEFAULT_TAB_NAME);
	            selecters.$commitInfoTabPanel.append($tab);
	            setActiveTab($tab);
	        }
	        else {
	            // タブのIDが振り直されるため、一旦保存されている検索情報を削除
	            removeTabFindInfoAll();
	            findInfos.forEach(function (info) {
	                var $tab = createTab(DEFAULT_TAB_NAME);
	                $tab['findInfo'] = JSON.parse(info);
	                $tab.find('a').text(changeTagName($tab['findInfo']));
	                selecters.$commitInfoTabPanel.append($tab);
	                // 改めてタブの検索情報を保存する
	                saveTabFindInfo($tab);
	                if (!$activeTab) {
	                    setActiveTab($tab);
	                }
	            });
	        }
	        // タブの追加ボタン
	        selecters.$commitInfoTabPanel.append(createAddTabButton());
	        // 一定間隔で、アクティブなタブを更新する
	        setInterval(updateActiveTab, UPDATE_INTERVAL);
	    })();
	}
	exports.setup = setup;
	/**
	 * @brief アクティブなタブの表示を更新する
	 */
	function updateActiveTab() {
	    find($activeTab.findInfo);
	}
	exports.updateActiveTab = updateActiveTab;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/// <reference path="../../typings/lodash/lodash.d.ts" />
	/**
	 * @brief コミット関連処理
	 */
	var CommitInfo = __webpack_require__(2);
	var selecters;
	var commitFiles = createFileArray();
	var $fileNames;
	var $commentTextArea;
	/**
	 * @brief コミット処理のセットアップ
	 */
	function setup(selecterObjects) {
	    selecters = selecterObjects;
	    $fileNames = selecters.$commitBox.find('#file_names');
	    var $cancelButton = selecters.$commitBox.find('#cancel_button');
	    var $execButton = selecters.$commitBox.find('#commit_button');
	    $commentTextArea = selecters.$commitBox.find('#comment_text');
	    // ページ全体にファイルをドロップされてもブラウザが処理を行わないように無視する
	    $('html').on('drop', function (e) {
	        e.preventDefault();
	    }).on('dragover', function (e) {
	        e.preventDefault();
	    });
	    // コミット用のドロップ領域にファイルがドロップされた場合の処理
	    selecters.$commitBox.on('dragover', function (e) {
	        e.preventDefault();
	        e.stopPropagation();
	    }).on('drop', function (e) {
	        var files = e.originalEvent.dataTransfer.files;
	        e.preventDefault();
	        e.stopPropagation();
	        for (var i = 0; i < files.length; i++) {
	            commitFiles.add(files[i]);
	        }
	        // 表示を更新
	        $fileNames.empty();
	        commitFiles.forEach(function (file) {
	            $fileNames.append('<p>' + file.name + '</p>');
	        });
	        $cancelButton.removeAttr('disabled');
	        $execButton.removeAttr('disabled');
	    });
	    $cancelButton.on('click', clearCommit); // コミットのキャンセル
	    $execButton.on('click', doCommit); // コミットの実行
	    // 初期化としてクリア処理を行う
	    clearCommit();
	}
	exports.setup = setup;
	function createFileArray() {
	    var array = [];
	    array['add'] = function (file) {
	        for (var i = 0; i < this.length; i++) {
	            if (file.name === this[i].name) {
	                // 同名のファイルが、追加された場合は
	                // パスが異なる同名のファイルが追加された可能性があるため
	                // リスト内のファイルを上書きする
	                this[i] = file;
	                return;
	            }
	        }
	        // 同名のファイルでない場合は、そのまま追加する
	        this.push(file);
	    };
	    return array;
	}
	/**
	 * @brief コミット情報をクリアする
	 */
	function clearCommit() {
	    commitFiles = createFileArray();
	    $fileNames.empty();
	    $fileNames.append($('<p>').text('ここにファイルをドロップ').addClass('hint_text'));
	    $commentTextArea.val('');
	}
	/**
	 * @brief コミットを行う
	 */
	function doCommit() {
	    var commitMessage = $commentTextArea.val();
	    if (commitMessage === '') {
	        // コミットメッセージが入力されていない場合は、無視する
	        return;
	    }
	    // アップロード中表示
	    selecters.$uploadingDialog.modal('show');
	    (function () {
	        var d = $.Deferred();
	        var fileNames = _.pluck(commitFiles, 'name');
	        $.post('/check_commit_safety', { 'file_names': fileNames }).done(function (data) {
	            if (data.response_code !== 0) {
	                d.reject(data.message);
	                return;
	            }
	            d.resolve();
	        }).fail(function (error, errorMessage) {
	            d.reject(errorMessage);
	        });
	        return d.promise();
	    })().then(function () {
	        var d = $.Deferred();
	        var formData = new FormData();
	        commitFiles.forEach(function (file) {
	            formData.append('file', file);
	        });
	        formData.append('comment', commitMessage);
	        // ファイルをアップロード
	        $.ajax('commit', {
	            method: 'POST',
	            contentType: false,
	            processData: false,
	            data: formData,
	            success: function (response) {
	                clearCommit();
	                // コミットに成功したら、表示されているタブを更新する
	                CommitInfo.updateActiveTab();
	                d.resolve();
	            }
	        }).fail(function (error) {
	            d.reject(error.responseText);
	        });
	        return d.promise();
	    }).fail(function (errorMessage) {
	        alert(errorMessage);
	    }).always(function () {
	        selecters.$uploadingDialog.modal('hide');
	    });
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/lodash/lodash.d.ts" />
	/**
	 * @brief 検索関連処理
	 */
	var Tag = __webpack_require__(1);
	/**
	 * @brief 検索処理のセットアップ
	 *
	 * @param selecters セレクタをまとめたオブジェクト
	 */
	function setup(selecters) {
	    var tagListArray = [
	        selecters.$inclusionAllTagList,
	        selecters.$inclusionAnyTagList,
	        selecters.$exclusionTagList,
	        selecters.$livingTagList
	    ];
	    selecters.$inclusionAllTagList.hintText = '必ず含むタグ';
	    selecters.$inclusionAnyTagList.hintText = 'いずれかを含むタグ';
	    selecters.$exclusionTagList.hintText = '除外するタグ';
	    selecters.$findDialog.setup = function (findInfo) {
	        selecters.$fileNamesText.val(findInfo.fileNames.join(','));
	        selecters.$inclusionAllTagList.tagNames = findInfo.inclusionAllTagNames;
	        selecters.$inclusionAnyTagList.tagNames = findInfo.inclusionAnyTagNames;
	        selecters.$exclusionTagList.tagNames = findInfo.exclusionTagNames;
	        selecters.$livingTagList.tagNames = findInfo.livingTagNames;
	        updateTagLists();
	        return this;
	    };
	    // 各タグの表示領域に、ドロップ設定を追加
	    tagListArray.forEach(function ($tagList) {
	        Tag.setupDrppableTagList($tagList, function (droppedTagName) {
	            $tagList.tagNames.push(droppedTagName);
	            var otherTagLists = _.without(tagListArray, $tagList);
	            otherTagLists.forEach(function ($tagList) {
	                $tagList.tagNames = _.without($tagList.tagNames, droppedTagName);
	            });
	            updateTagLists();
	        });
	    });
	    function updateTagLists() {
	        tagListArray.forEach(function ($tagList) {
	            Tag.updateTagList($tagList, 5);
	        });
	    }
	}
	exports.setup = setup;
	;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/// <reference path="../../typings/lodash/lodash.d.ts" />
	/**
	 * @brief 履歴処理
	 */
	var Util = __webpack_require__(8);
	var selecters;
	var fileName;
	var diffCheckArray = [];
	function setup(selecterObjects) {
	    selecters = selecterObjects;
	    diffCheckArray = [];
	    // 履歴ダイアログにセットアップメソッドを追加
	    selecters.$dialog.setup = function (historyInfoArray, isDiffSupport) {
	        selecters.$infoTable.empty();
	        // 差分に対応したフォーマットの場合は、差分表示を有効にする
	        (function () {
	            if (isDiffSupport) {
	                selecters.$diffButton.removeAttr('disabled');
	            }
	            else {
	                selecters.$diffButton.attr('disabled', 'disabled');
	            }
	        })();
	        historyInfoArray.forEach(function (historyInfo) {
	            // ファイル名を保存しておく
	            fileName = historyInfo.name;
	            var $checkBox = $('<input type="checkbox">');
	            diffCheckArray.push({ $checkBox: $checkBox, version: historyInfo.version });
	            var $tableRow = $('<tr>');
	            Util.appendTableRowCell($tableRow, $checkBox, $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name), historyInfo.version, historyInfo.comment, historyInfo.user_name, historyInfo.commit_time);
	            selecters.$infoTable.append($tableRow);
	        });
	        return selecters.$dialog;
	    };
	    // 差分確認ボタンが押された
	    selecters.$diffButton.on('click', function () {
	        // チェックが2つ以上あることを確認
	        var checkedVersions = _(diffCheckArray).filter(function (diffCheck) {
	            return (diffCheck.$checkBox.prop('checked'));
	        }).pluck('version').value();
	        if (checkedVersions.length < 2) {
	            alert('差分を確認する2つのバージョンを選んでください');
	            return;
	        }
	        var oldVersion = _.min(checkedVersions);
	        var newVersion = _.max(checkedVersions);
	        Util.post('diff', {
	            file_name: fileName,
	            old_version: oldVersion,
	            new_version: newVersion
	        }, function (data) {
	            if (data.response_code !== 0) {
	                alert(data.message);
	                return;
	            }
	            selecters.$diffDialog.setup(oldVersion, newVersion, data.old_diff_html, data.new_diff_html, data.diff_info).modal('show');
	        }, function (error) {
	            // @todo エラー処理を実装する
	        });
	    });
	    // 差分表示ダイアログのセットアップ処理
	    selecters.$diffDialog.setup = function (oldVersion, newVersion, oldDiffHtml, newDiffHtml, diffInfo) {
	        var $this = $(this);
	        $this.find('#left_title').text(fileName + ' v' + oldVersion);
	        $this.find('#right_title').text(fileName + ' v' + newVersion);
	        var leftHtml = convertViewHtml(oldDiffHtml, diffInfoLeftLineNumbers(diffInfo, 'd'), diffInfoLeftLineNumbers(diffInfo, 'c'), []);
	        var rightHtml = convertViewHtml(newDiffHtml, [], diffInfoRightLineNumbers(diffInfo, 'c'), diffInfoRightLineNumbers(diffInfo, 'a'));
	        var $leftDoc = $($this.find('#left_iframe')[0].contentDocument.documentElement);
	        var $rightDoc = $($this.find('#right_iframe')[0].contentDocument.documentElement);
	        $leftDoc.html(leftHtml);
	        $rightDoc.html(rightHtml);
	        setCss($leftDoc);
	        setCss($rightDoc);
	        return this;
	    };
	}
	exports.setup = setup;
	function splitLines(text) {
	    return text.split(/\r\n|\r|\n/);
	}
	function setCss($doc) {
	    $doc.find('td').css('white-space', 'nowrap');
	    $doc.find('.diff_delete').css('border', '3px solid gray');
	    $doc.find('.diff_change').css('border', '3px solid green');
	    $doc.find('.diff_add').css('border', '3px solid red');
	}
	/**
	 * @brief 差分情報から左側の変更行番号を配列として返す
	 */
	function diffInfoLeftLineNumbers(diffInfo, typeChar) {
	    var diffInfoList = splitLines(diffInfo);
	    var result = [];
	    // 削除された行情報
	    diffInfoList.forEach(function (info) {
	        var rangeInfo = new RegExp('([\\d,]+)' + typeChar).exec(info);
	        if (!rangeInfo) {
	            return;
	        }
	        var range = rangeInfo[1];
	        var multiLineInfo = /(\d+),(\d+)/.exec(range);
	        var lineNumbers = [];
	        if (multiLineInfo) {
	            // カンマで区切られているので、複数行とみなす
	            var begin = parseInt(multiLineInfo[1]);
	            var end = parseInt(multiLineInfo[2]) + 1;
	            result = result.concat(_.range(begin, end));
	        }
	        else {
	            // カンマで区切られていないので、1行とみなす
	            result.push(parseInt(range));
	        }
	    });
	    return result;
	}
	/**
	 * @brief 差分情報から右側の変更行番号を配列として返す
	 */
	function diffInfoRightLineNumbers(diffInfo, typeChar) {
	    var diffInfoList = splitLines(diffInfo);
	    var result = [];
	    // 削除された行情報
	    diffInfoList.forEach(function (info) {
	        var rangeInfo = new RegExp(typeChar + '([\\d,]+)').exec(info);
	        if (!rangeInfo) {
	            return;
	        }
	        var range = rangeInfo[1];
	        var multiLineInfo = /(\d+),(\d+)/.exec(range);
	        var lineNumbers = [];
	        if (multiLineInfo) {
	            // カンマで区切られているので、複数行とみなす
	            var begin = parseInt(multiLineInfo[1]);
	            var end = parseInt(multiLineInfo[2]) + 1;
	            result = result.concat(_.range(begin, end));
	        }
	        else {
	            // カンマで区切られていないので、1行とみなす
	            result.push(parseInt(range));
	        }
	    });
	    return result;
	}
	function insertTagClassInDiffLines(textLines, lineNumbers, className) {
	    lineNumbers.forEach(function (lineNumber) {
	        var index = lineNumber - 1;
	        var line = textLines[index];
	        var topTagInfo = /^\s*<\w+ /.exec(line);
	        if (!topTagInfo) {
	            // もし、先頭のタグがなければ、何も行わない
	            return;
	        }
	        var insertIndex = topTagInfo[0].length;
	        textLines[index] = line.slice(0, insertIndex) + 'class="' + className + '" ' + line.slice(insertIndex);
	    });
	    return textLines;
	}
	function convertViewHtml(htmlText, deleteLineNumbers, changeLineNumbers, addLineNumbers) {
	    var lines = splitLines(htmlText);
	    // ヘッダは無視する
	    (function () {
	        var bodyLineIndex = 1 + _.findIndex(lines, function (line) {
	            return /<body>/.test(line);
	        });
	        var outHeaderLine = function (number) {
	            return number > bodyLineIndex;
	        };
	        deleteLineNumbers = _.filter(deleteLineNumbers, outHeaderLine);
	        changeLineNumbers = _.filter(changeLineNumbers, outHeaderLine);
	        addLineNumbers = _.filter(addLineNumbers, outHeaderLine);
	    })();
	    lines = insertTagClassInDiffLines(lines, deleteLineNumbers, 'diff_delete');
	    lines = insertTagClassInDiffLines(lines, changeLineNumbers, 'diff_change');
	    lines = insertTagClassInDiffLines(lines, addLineNumbers, 'diff_add');
	    var result = '';
	    lines.forEach(function (line) {
	        result = result.concat(line);
	    });
	    return result;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/**
	 * @brief ユーザーのコミット確認状況処理
	 */
	var Util = __webpack_require__(8);
	function setup(selecters) {
	    // ダイアログにセットアップメソッドを追加
	    selecters.$dialog.setup = function (data) {
	        var $tbody = selecters.$dialog.find('tbody');
	        $tbody.empty();
	        data.user_view_infos.forEach(function (info) {
	            var $tableRow = $('<tr>');
	            Util.appendTableRowCell($tableRow, info.user_name, data.file_latest_version - info.last_view_version);
	            $tbody.append($tableRow);
	        });
	        return this;
	    };
	}
	exports.setup = setup;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @brief クライアント側とサーバー側で共通で使用する定数
	 */
	exports.TAG_PREFIX_SYSTEM = 'system:';
	exports.TAG_NAME = {
	    PREFIX: {
	        FREE: 'free:',
	        PERSONAL: 'personal:',
	        EDIT: 'edit:',
	        SYSTEM: exports.TAG_PREFIX_SYSTEM
	    },
	    CLOSED: exports.TAG_PREFIX_SYSTEM + 'closed'
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../typings/jquery/jquery.d.ts" />
	/**
	 * @brief ユーティリティ
	 */
	/**
	 * @brief POSTリクエストで、APIを呼び出す
	 *
	 * @param apiName API名
	 * @param param リクエストパラメータ
	 * @param successFunc 成功時に呼ばれる関数
	 * @param errorFunc エラー時に呼ばれる関数（省略可能）
	 *
	 * @note エラー処理はダイアログが表示される
	 */
	function post(apiName, param, successFunc, errorFunc) {
	    errorFunc = errorFunc || function (error, errorMessage) {
	        alert(errorMessage);
	    };
	    $.post('/' + apiName, param).done(successFunc).fail(errorFunc);
	}
	exports.post = post;
	/**
	 * @brief アイコン付きテキストjQueryオブジェクトを生成する
	 *
	 * @param iconName アイコン名
	 * @param text テキスト
	 * @param color アイコンとテキストの色
	 *
	 * @return jQueryオブジェクト
	 */
	function createIconText(iconName, text, color) {
	    var iconCss = {
	        'color': color,
	        'float': 'left',
	        'margin-right': '3px'
	    };
	    var textCss = {
	        'color': color,
	        'float': 'left'
	    };
	    var $icon = $('<div>').addClass('glyphicon glyphicon-' + iconName).css(iconCss);
	    var $text = $('<div>').text(text).css(textCss);
	    return $('<div>').append($icon).append($text);
	}
	exports.createIconText = createIconText;
	/**
	 * @brief テーブルの行に複数のセルを追加する
	 *
	 * @param $tableRow テーブルの行
	 * @param arguments 可変長引数で、追加するセルを受け取る
	 */
	function appendTableRowCell($tableRow) {
	    var content = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        content[_i - 1] = arguments[_i];
	    }
	    for (var i = 1; i < arguments.length; i++) {
	        var cellContent = arguments[i];
	        if (typeof cellContent === 'string') {
	            // 文字列なら、テキストとして設定
	            $tableRow.append($('<td>').text(cellContent));
	        }
	        else {
	            // 文字列以外なら、要素として追加
	            $tableRow.append($('<td>').append(cellContent));
	        }
	    }
	}
	exports.appendTableRowCell = appendTableRowCell;


/***/ }
/******/ ]);