/**
 * @brief コミット関連処理
 */
var gspecv = gspecv || {};

gspecv.commit = (function() {
  var selecters;
  var commitFiles = createFileArray();

  /**
   * @brief コミット処理のセットアップ
   */
  function setup(selecterObjects) {
    selecters = selecterObjects;

    $fileNames = selecters.$commitBox.find('#file_names');
    $cancelButton = selecters.$commitBox.find('#cancel_button');
    $execButton = selecters.$commitBox.find('#commit_button');
    $commentTextArea = selecters.$commitBox.find('#comment_text');

    // ページ全体にファイルをドロップされてもブラウザが処理を行わないように無視する
    $('html').on('drop', function(e) {
      e.preventDefault();
    })
    .on('dragover', function(e) {
      e.preventDefault();
    });

    // コミット用のドロップ領域にファイルがドロップされた場合の処理
    selecters.$commitBox.on('dragover', function(e) {
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

    // 初期化としてクリア処理を行う
    clearCommit();
  }

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
    if(commitMessage === '') {
      // コミットメッセージが入力されていない場合は、無視する
      return;
    }

    // アップロード中表示
    selecters.$uploadingDialog.modal('show');

    (function() {
      var d = new $.Deferred();
      var fileNames = _.pluck(commitFiles, 'name');

      $.post('/check_commit_safety', { 'file_names': fileNames })
        .done(function(data) {
          if(data.response_code !== 0) {
            d.reject(data.message);
            return;
          }

          d.resolve();
        })
        .fail(function(error, errorMessage) {
          d.reject(errorMessage);
        });

      return d.promise();
    })()
    .then(function() {
      var d = new $.Deferred();
      var formData = new FormData();
      commitFiles.forEach(function(file) {
        formData.append('file', file);
      });
      formData.append('comment', commitMessage);

      // ファイルをアップロード
      $.ajax('commit', {
        method: 'POST',
        contentType: false,
        processData: false,
        data:formData,
        success: function(response) {
          clearCommit();

          // コミットに成功したら、表示されているタブを更新する
          gspecv.commitInfo.updateActiveTab();

          d.resolve();
        }
      }).fail(function(error) {
        d.reject(error.responseText);
      });

      return d.promise();
    })
    .fail(function(errorMessage) {
        alert(errorMessage);
    })
    .always(function() {
        selecters.$uploadingDialog.modal('hide');
    });
  }

  return {
    setup: setup
  };
})();

