/**
 * @brief コミット情報処理
 */
var gspecv = gspecv || {};
gspecv.commitInfo = {};

/**
 * @brief コミット情報処理のセットアップ
 *
 * @param selecters セレクタをまとめたオブジェクト
 *
 * return 検索関数
 */
gspecv.commitInfo.setup = function(selecters) {
  const DEFAULT_TAG_NAME = 'All';
  var $activeTab;
  var tabIdCounter = 0;

  // 検索条件に合ったタグ名を取得する
  function changeTagName(findInfo) {
    // 検索条件を一つの配列とする
    var findValueArray = (findInfo.file_names || [])
                          .concat(findInfo.inclusion_all_tag_names || [])
                          .concat(findInfo.inclusion_any_tag_names || [])
                          .concat(findInfo.exclusion_tag_names || []);
    if(findValueArray[0]) {
      // 先頭の要素があれば、その名前を返す
      return findValueArray[0];
    }

    return DEFAULT_TAG_NAME;
  }

  function find(option) {
    $activeTab.find('a').text(changeTagName(option));
    localStorage['find_infos_' + $activeTab.tabId] = JSON.stringify($activeTab.findInfo);

    $.post('find', option, function(fileInfos) {
      selecters.$commitInfoTBody.empty();

      fileInfos.forEach(function(fileInfo) {
        var $tableRow = $('<tr>');

        appendTableRowCell($tableRow,
                          createDropdownMenu(fileInfo),
                          $('<a href=download/' + fileInfo._id + '></a>').text(fileInfo.name),
                          createTagCell(fileInfo.tag_names),
                          fileInfo.version,
                          fileInfo.comment,
                          fileInfo.user_name);

        selecters.$commitInfoTBody.append($tableRow);
      });
    },
    'json')
    .error(function(error, errorMessage) {
      alert(errorMessage);
    });
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
      $cell.append(gspecv.tag.createTagLabel(name));
    });

    return $cell;
  }

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
                        historyInfo.user_name);

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

  /**
   * @brief タブを生成する
   *
   * @param tabName 表示するタブ名
   *
   * @return タブのjQueryオブジェクト
   */
  function createTab(tabName) {
    var $tabName = $('<a>').attr('role', "tab").attr('data-toggle', "tab").text(tabName);
    var $tab = $('<li>').attr('role', 'presentation').append($tabName);
    $tab.findInfo = {};
    $tab.tabId = tabIdCounter;
    tabIdCounter++;

    $tab.on('click', function() {
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

      var $tab = createTab(DEFAULT_TAG_NAME);
      selecters.$commitInfoTabPanel.append($tab);

      // 新しく追加されたタブの右側に表示するために、新しく追加ボタンを生成
      selecters.$commitInfoTabPanel.append(createAddTabButton());
    });
    selecters.$commitInfoTabPanel.append($addButton);
  }

  (function() {
    // ローカルストレージを設定
    var findInfos = _(Object.keys(localStorage))
                      .filter(function(value) { return /^find_infos_/.test(value); })
                      .map(function(key) { return localStorage[key]; });

    if(findInfos.length === 0) {
      // 最初のタブを追加
      var $tab = createTab(DEFAULT_TAG_NAME).addClass('active');
      selecters.$commitInfoTabPanel.append($tab);
      $activeTab = $tab;

      // セットアップ時に、最新のファイルを検索する
      find();
    } else {
      findInfos.forEach(function(info) {
        var $tab = createTab(DEFAULT_TAG_NAME);
        $tab.findInfo = JSON.parse(info);
        $tab.find('a').text(changeTagName($tab.findInfo));
        selecters.$commitInfoTabPanel.append($tab);

        if(!$activeTab) {
          $activeTab = $tab;
          $activeTab.addClass('active');
          find($activeTab.findInfo);
        }
      });
    }

    // タブの追加ボタン
    selecters.$commitInfoTabPanel.append(createAddTabButton());
  })();

  return find;
};
