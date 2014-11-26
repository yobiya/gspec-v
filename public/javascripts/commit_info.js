/**
 * @brief コミット情報処理
 */
var gspecv = gspecv || {};
gspecv.commitInfo = {};

(function() {
  const UPDATE_INTERVAL = 30 * 1000;  // 30秒
  const DEFAULT_TAB_NAME = 'All';
  const TAB_CLASS_NAME = 'find_tab';
  var $activeTab;
  var tabIdCounter = 0;
  var selecters;

  function find(option) {
    $activeTab.find('a').text(changeTagName(option));
    saveTabFindInfo($activeTab);

    $.post('find', option, function(fileInfos) {
      selecters.$commitInfoTBody.empty();

      fileInfos.forEach(function(fileInfo) {
        var $tableRow = $('<tr>');
        var notViewVersionCount = fileInfo.version - fileInfo.user_last_view_version;

        $downloadFileName = $('<a>')
                              .attr('href', 'download/' + fileInfo._id)
                              .text(fileInfo.name)
                              .on('click', function() {
                                // ダウンロードしたファイルが確認済みのファイルになったので
                                // 未確認のコミットファイルの数を非表示にする
                                $tableRow.find('td')[1].innerText = '';
                              });

        appendTableRowCell($tableRow,
                          createDropdownMenu(fileInfo),
                          notViewVersionCount || '',
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
    .error(function(error, errorMessage) {
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

    var $history = $('<a>').addClass('glyphicon glyphicon-time')
                            .text(' 履歴')
                            .on('click', function() {
                              $.post('/history', { file_name: fileInfo.name })
                                .done(function(historyInfoArray) {
                                  selecters.$historyDialog.setup(historyInfoArray).modal('show');
                                })
                                .fail(function(error, errorMessage) {
                                  alert(errorMessage);
                                });
                            });
    var $tagEdit = $('<a>').addClass('glyphicon glyphicon-tags')
                            .text(' タグ編集')
                            .on('click', function() {
                              $.post('/edit_tag_info', { file_name: fileInfo.name })
                                .done(function(data) {
                                  selecters.$tagEditDialog
                                    .setup(fileInfo.name, data)
                                    .modal('show');
                                })
                                .fail(function(error, errorMessage) {
                                  alert(errorMessage);
                                });
                            });

    var $menuContents = $('<li>').addClass('dropdown-menu')
                                .append($('<li>').append($history))
                                .append($('<li>').append($tagEdit));

    var $menu = $('<div>').append($button).append($menuContents);
    return $('<div>').addClass('dropdown').append($menu);
  }

  /**
   * @brief タグのセルを生成
   *
   * @param tagNames タグ名の配列
   */
  function createTagCell(tagNames) {
    $cell = $('<div>');

    tagNames.forEach(function(name) {
      $cell.append(gspecv.tag.createTagLabel(name, false));
    });

    return $cell;
  }

  /**
   * @brief テーブルの行に複数のセルを追加する
   *
   * @param $tableRow テーブルの行
   * @param arguments 可変長引数で、追加するセルを受け取る
   */
  function appendTableRowCell($tableRow) {
    for(var i = 1; i < arguments.length; i++) {
      var cellContent = arguments[i];

      if(typeof cellContent === 'string') {
        // 文字列なら、テキストとして設定
        $tableRow.append($('<td>').text(cellContent));
      } else {
        // 文字列以外なら、要素として追加
        $tableRow.append($('<td>').append(cellContent));
      }
    }
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
  function removeTabFindInfoAll($tab) {
    var findInfoKeys = _(Object.keys(localStorage)).filter(function(value) { return /^find_infos_/.test(value); });
    findInfoKeys.forEach(function(key) {
      delete localStorage[key];
    });
  }

  /**
   * @brief コミット情報処理のセットアップ
   *
   * @param selecterObjects セレクタをまとめたオブジェクト
   *
   * return 検索関数
   */
  function setup(selecterObjects) {
    selecters = selecterObjects;

    // 検索の実行
    selecters.$findDialog.find('#find_button').on('click', function() {
      var fileNames = selecters.$findDialog.find('#file_names').val();
      var fileNameArray = (fileNames === '') ? ([]) : (fileNames.split(','));

      $activeTab.findInfo = {
        file_names: fileNameArray,
        inclusion_all_tag_names: selecters.$inclusionAllTagList.tagNames,
        inclusion_any_tag_names: selecters.$inclusionAnyTagList.tagNames,
        exclusion_tag_names: selecters.$exclusionTagList.tagNames
      };

      find($activeTab.findInfo);
    });

    // 履歴ダイアログにセットアップメソッドを追加
    selecters.$historyDialog.setup = function(historyInfoArray) {
      selecters.$historyInfoTable.empty();

      historyInfoArray.forEach(function(historyInfo) {
        var $tableRow = $('<tr>');

        appendTableRowCell($tableRow,
                          $('<a href=download_with_version/' + historyInfo._id + '></a>').text(historyInfo.name),
                          historyInfo.version,
                          historyInfo.comment,
                          historyInfo.user_name,
                          historyInfo.commit_time);

        selecters.$historyInfoTable.append($tableRow);
      });
   

      return selecters.$historyDialog;
    };

    // 検索ボタンの動作を設定
    selecters.$findButton.on('click', function() {
      // 最新のコミットで使用されているタグ名一覧を取得する
      $.post('/latest_tag_names', {})
        .done(function(tagNames) {

          var livingTagNames = _(tagNames)
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

      $($('.' + TAB_CLASS_NAME)[0]).addClass('active');
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
      $tab.findInfo = {};
      $tab.tabId = tabIdCounter;
      tabIdCounter++;

      $tab.on('shown.bs.tab', function() {
        $activeTab = $tab;
        find($tab.findInfo);
      });

      return $tab;
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
        // 自分を削除
        $addButton.remove();

        var $tab = createTab(DEFAULT_TAB_NAME);
        selecters.$commitInfoTabPanel.append($tab);

        // 新しく追加されたタブの右側に表示するために、新しく追加ボタンを生成
        selecters.$commitInfoTabPanel.append(createAddTabButton());
      });
      selecters.$commitInfoTabPanel.append($addButton);
    }

    (function() {
      var findInfos = loadTabFindInfoArray();
      if(findInfos.length === 0) {
        // 最初のタブを追加
        var $tab = createTab(DEFAULT_TAB_NAME).addClass('active');
        selecters.$commitInfoTabPanel.append($tab);
        $activeTab = $tab;

        // セットアップ時に、最新のファイルを検索する
        find({});
      } else {
        // タブのIDが振り直されるため、一旦保存されている検索情報を削除
        removeTabFindInfoAll();

        findInfos.forEach(function(info) {
          var $tab = createTab(DEFAULT_TAB_NAME);
          $tab.findInfo = JSON.parse(info);
          $tab.find('a').text(changeTagName($tab.findInfo));
          selecters.$commitInfoTabPanel.append($tab);

          // 改めてタブの検索情報を保存する
          saveTabFindInfo($tab);

          if(!$activeTab) {
            $activeTab = $tab;
            $activeTab.addClass('active');
            find($activeTab.findInfo);
          }
        });
      }

      // タブの追加ボタン
      selecters.$commitInfoTabPanel.append(createAddTabButton());

      // 一定間隔で、アクティブなタブを更新する
      setInterval(updateActiveTab, UPDATE_INTERVAL);
    })();

    return find;
  }

  /**
   * @brief アクティブなタブの表示を更新する
   */
  function updateActiveTab() {
    find($activeTab.findInfo);
  }

  // 外部に公開する関数を設定
  gspecv.commitInfo.setup = setup;
  gspecv.commitInfo.updateActiveTab = updateActiveTab;

})();

