/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />

/**
 * @brief コミット情報処理
 */
var gspecv = gspecv || {};

gspecv.commitInfo = (function() {
  var UPDATE_INTERVAL = 30 * 1000;  // 30秒
  var DEFAULT_TAB_NAME = 'All';
  var TAB_CLASS_NAME = 'find_tab';
  var $activeTab;
  var tabIdCounter = 0;
  var selecters;
  var userName;

  function find(option) {
    // 編集中タグを追加する
    function addEditTag(fileInfo) {
      (function() {
        var d = $.Deferred();

        // 最新のタグ情報を取得
        $.post('/edit_tag_info', { file_name: fileInfo.name })
          .done(function(data) {
            d.resolve(data.file_tags);
          })
          .fail(function(error, errorMessage) {
            d.reject(errorMessage);
          });

        return d.promise();
      })()
      .then(function(tagNames: any) {
        var d = $.Deferred();

        var userEditTagName = gspecv.constant.TAG_NAME.PREFIX.EDIT + userName;
		var otherUserEditTagName = _.find(tagNames, function(tagName: any) {
          // 自分以外の編集中タグ名ならtrueを返す
          if(tagName === userEditTagName) {
            return false;
          }

          return new RegExp("^" + gspecv.constant.TAG_NAME.PREFIX.EDIT).test(tagName);
        });

        if(otherUserEditTagName) {
          var otherUserName = otherUserEditTagName.substr(gspecv.constant.TAG_NAME.PREFIX.EDIT.length);
          console.log(otherUserName );
          d.reject(otherUserName + " が編集中なので、" + userName + " 編集中タグを追加できませんでした");
          return d.promise();
        }

        // 編集中タグを追加する
        var editTagNames = [gspecv.constant.TAG_NAME.PREFIX.EDIT + userName];
        gspecv.util.post('add_tag',
          { commit_document_id: fileInfo._id, tag_names: editTagNames },
          function(data) {
            gspecv.commitInfo.updateActiveTab();
            d.resolve();
          },
          function(error, errorMessage) {
            d.reject(errorMessage);
          });

        return d.promise();
      })
      .fail(function(errorMessage) {
        alert(errorMessage);
      });
    }

    $activeTab.find('a').text(changeTagName(option));
    saveTabFindInfo($activeTab);

    $.post('find', option, function(fileInfos) {
      selecters.$commitInfoTBody.empty();

      fileInfos.forEach(function(fileInfo) {
        var $tableRow = $('<tr>');
        var notViewVersionCount = fileInfo.version - fileInfo.user_last_view_version;

        var $editAndFileDownload = $('<a>')
									  .attr('href', 'download/' + fileInfo._id)
									  .append('<div class="glyphicon glyphicon-edit">')
									  .on('click', function() {
										// ダウンロードしたファイルが確認済みのファイルになったので
										// 未確認のコミットファイルの数を非表示にする
										$tableRow.find('td')[1].innerText = '';

										// 編集中タグを追加する
										addEditTag(fileInfo);
									  });

        var $downloadFileName = $('<a>')
								  .attr('href', 'download/' + fileInfo._id)
								  .text(fileInfo.name)
								  .on('click', function() {
									// ダウンロードしたファイルが確認済みのファイルになったので
									// 未確認のコミットファイルの数を非表示にする
									$tableRow.find('td')[1].innerText = '';
								  });

        gspecv.util.appendTableRowCell($tableRow,
                                        createDropdownMenu(fileInfo),
                                        notViewVersionCount || '',
                                        $editAndFileDownload,
                                        $downloadFileName,
                                        createTagCell(fileInfo.tag_names),
                                        fileInfo.version,
                                        fileInfo.comment,
                                        fileInfo.commit_user_name,
                                        fileInfo.commit_time);

        selecters.$commitInfoTBody.append($tableRow);
      });
    },
    'json')
    .fail(function(error, errorMessage) {
      alert(errorMessage);
    });
  }

  // 検索条件に合ったタグ名を取得する
  function changeTagName(findInfo) {
    // 検索条件を一つの配列とする
    var findValueArray = (findInfo.file_names || [])
                          .concat(findInfo.inclusion_all_tag_names || [])
                          .concat(findInfo.inclusion_any_tag_names || [])
                          .concat(findInfo.exclusion_tag_names || []);

    var headName = findValueArray[0];
    if(headName) {
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

    var $history = $('<a>')
                    .addClass('glyphicon glyphicon-time')
                    .text(' 履歴')
                    .on('click', function() {
                      $.post('/history', { file_name: fileInfo.name })
                        .done(function(historyInfo) {
                          selecters.$historyDialog.setup(historyInfo.info_array, historyInfo.diff_support).modal('show');
                        })
                        .fail(function(error, errorMessage) {
                          alert(errorMessage);
                        });
                    });

    var $tagEdit = $('<a>')
                    .addClass('glyphicon glyphicon-tags')
                    .text(' タグ編集')
                    .on('click', function() {
                      $.post('/edit_tag_info', { file_name: fileInfo.name })
                        .done(function(data) {
                          selecters.$tagEditDialog.setup(fileInfo.name, data).modal('show');
                        })
                        .fail(function(error, errorMessage) {
                          alert(errorMessage);
                        });
                    });

    var $usersView = $('<a>')
                    .addClass('glyphicon glyphicon-eye-open')
                    .text(' ユーザーの確認状況')
                    .on('click', function() {
                      $.post('/users_view_info', { file_name: fileInfo.name })
                        .done(function(data) {
                          selecters.$userViewDialog.setup(data).modal('show');
                        })
                        .fail(function(error, errorMessage) {
                          alert(errorMessage);
                        });
                    });

    var $removeFile = $('<a>')
                    .addClass('glyphicon glyphicon-trash')
                    .text(' 削除')
                    .on('click', function() {
/*                      $.post('/users_view_info', { file_name: fileInfo.name })
                        .done(function(data) {
                          selecters.$userViewDialog.setup(data).modal('show');
                        })
                        .fail(function(error, errorMessage) {
                          alert(errorMessage);
                        });*/
                    });

    var $menuContents = $('<li>')
                          .addClass('dropdown-menu')
                          .append($('<li>').append($history))
                          .append($('<li>').append($tagEdit))
                          .append($('<li>').append($usersView))
                          .append($('<li>').append('<a><hr/></a>'))
                          .append($('<li>').append($removeFile));

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

    tagNames = _.sortBy(tagNames, function(tagName: any) {
      var prefixRegExp = new RegExp('^[^:]+:');
      switch(prefixRegExp.exec(tagName)[0]) {
        case 'system:': return 0;
        case 'edit:': return 1;
        case 'personal:': return 2;
        case 'free:': return 3;
      }

      return 5;
    });

    tagNames.forEach(function(name) {
      $cell.append(gspecv.tag.createTagLabel(name, false));
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
    return _(Object.keys(localStorage))
            .filter(function(value) { return /^find_infos_/.test(value); })
            .map(function(key) { return localStorage[key]; })
            .value();
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
    var findInfoKeys = _(Object.keys(localStorage)).filter(function(value) { return /^find_infos_/.test(value); });
    findInfoKeys.forEach(function(key) {
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
    selecters.$findDialog.find('#find_button').on('click', function() {
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
    selecters.$findButton.on('click', function() {
      // 最新のコミットで使用されているタグ名一覧を取得する
      $.post('/latest_tag_names', {})
        .done(function(tagNames) {

		  var livingTagNames = (<any>_(tagNames))
                                .difference($activeTab.findInfo.inclusion_all_tag_names)
                                .difference($activeTab.findInfo.inclusion_any_tag_names)
                                .difference($activeTab.findInfo.exclusion_tag_names)
                                .value();

          var findInfo = {
            fileNames: $activeTab.findInfo.file_names || [],
            inclusionAllTagNames: $activeTab.findInfo.inclusion_all_tag_names || [],
            inclusionAnyTagNames: $activeTab.findInfo.inclusion_any_tag_names || [],
            exclusionTagNames: $activeTab.findInfo.exclusion_tag_names || [],
            livingTagNames: livingTagNames
          };
          selecters.$findDialog.setup(findInfo).modal('show');
        })
        .fail(function(error, errorMessage) {
          alert(errorMessage);
        });
    });

    // タブを閉じるボタンの動作を設定
    selecters.$closeTabButton.on('click', function() {
      if(loadTabFindInfoArray().length <= 1) {
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

      $tab.on('shown.bs.tab', function() {
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
      $addButton.on('click', function() {
        $addButton.before(createTab(DEFAULT_TAB_NAME));
      });
      selecters.$commitInfoTabPanel.append($addButton);
    }

    // 画面サイズに合わせて、コミット情報の表示領域を変更する
    $(window).on('load resize', function() {
      $('.commit_info_table').height($(window).height() - 310);
    });

    (function() {
      var findInfos = loadTabFindInfoArray();
      if(findInfos.length === 0) {
        // 最初のタブを追加
        var $tab = createTab(DEFAULT_TAB_NAME);
        selecters.$commitInfoTabPanel.append($tab);
        setActiveTab($tab);
      } else {
        // タブのIDが振り直されるため、一旦保存されている検索情報を削除
        removeTabFindInfoAll();

        findInfos.forEach(function(info) {
          var $tab = createTab(DEFAULT_TAB_NAME);
          $tab['findInfo'] = JSON.parse(info);
          $tab.find('a').text(changeTagName($tab['findInfo']));
          selecters.$commitInfoTabPanel.append($tab);

          // 改めてタブの検索情報を保存する
          saveTabFindInfo($tab);

          if(!$activeTab) {
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

  /**
   * @brief アクティブなタブの表示を更新する
   */
  function updateActiveTab() {
    find($activeTab.findInfo);
  }

  // 外部に公開する関数を設定
  return {
    setup: setup,
    updateActiveTab: updateActiveTab
  };
})();

