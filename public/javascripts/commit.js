/**
 * @brief コミット関連処理
 */
var gspecv = gspecv || {};

/**
 * @brief コミット処理のセットアップ
 *
 * @param $commitBox コミット領域のセレクタ
 * @param commitCallback コミットを行った場合に呼ばれるコールバック
 */
gspecv.setupCommit = function($commitBox, commitCallback) {
  function createFileArray() {
    var array = [];
    array.add = function(file) {
      for(var i = 0; i < this.length; i++) {
        if(file.name === this[i].name) {
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

  var commitFiles = createFileArray();
  $fileNames = $commitBox.find('#file_names');
  $cancelButton = $commitBox.find('#commit_button_cancel');
  $execButton = $commitBox.find('#commit_button_commit');
  $commentTextArea = $commitBox.find('#comment_text');

  // ページ全体にファイルをドロップされてもブラウザが処理を行わないように無視する
  $('html').on('drop', function(e) {
    e.preventDefault();
  })
  .on('dragover', function(e) {
    e.preventDefault();
  });

  // コミット用のドロップ領域にファイルがドロップされた場合の処理
  $commitBox.on('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('drop', function(e) {
    var files = e.originalEvent.dataTransfer.files;

    e.preventDefault();
    e.stopPropagation();

    // ファイルを配列に追加
    for(var i = 0; i < files.length; i++) {
      commitFiles.add(files[i]);
    }

    // 表示を更新
    $fileNames.empty();
    commitFiles.forEach(function(file) {
      $fileNames.append('<p>' + file.name + '</p>');
    });
    $cancelButton.removeAttr('disabled');
    $execButton.removeAttr('disabled');
  });

  $cancelButton.on('click', clearCommit); // コミットのキャンセル
  $execButton.on('click', doCommit);      // コミットの実行

  /**
   * @brief コミット情報をクリアする
   */
  function clearCommit() {
    commitFiles = createFileArray();
    $fileNames.empty();
    $fileNames.append($('<p></p>').text('Drop file here').addClass('hint_text'));
    $commentTextArea.val('');
  }

  /**
   * @brief コミットを行う
   */
  function doCommit() {
    var formData = new FormData();
    commitFiles.forEach(function(file) {
      formData.append('file', file);
    });
    formData.append('comment', $commentTextArea.val());

    // ファイルをアップロード
    $.ajax('commit', {
      method: 'POST',
      contentType: false,
      processData: false,
      data:formData,
      success: function(response) {
        clearCommit();

        if(commitCallback) {
          commitCallback();
        }
      }
    }).fail(function(error) {
      alert(error.responseText);
    });
  }

  // 初期化としてクリア処理を行う
  clearCommit();
};

