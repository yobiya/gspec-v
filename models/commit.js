/**
 * @brief コミット
 */
module.exports = function(mongoose) {
  var fs = require('fs');
  var path = require('path');
  var constants = require('./constants');
  var util = require('util');
  var schemas = {
    commitInfo: mongoose.Schema({name: String, path: String, comment: String, tag_names: [String], version: Number, commit_time: Date, user_name: String}),
    latestCommitId: mongoose.Schema({ commit_doc_id: mongoose.Schema.Types.ObjectId }),
  };

  var mongoModels = {
    commitInfo: mongoose.model('commit_infos', schemas.commitInfo),
    latestCommitId: mongoose.model('latest_commit_info_ids', schemas.latestCommitId),
  };

  /**
   * @brief ファイルをコミット
   *
   * @param uploadFiles アップロードされたファイルの情報配列
   * @param comment コミットコメント
   * @param userName コミットを行ったユーザー名
   */
  function commit(uploadFiles, comment, userName) {
    uploadFiles.forEach(function(uploadFile) {
      // コミットされている同名のファイルの最新バージョン番号を取得する
      getLatestFileVersion(uploadFile.originalname, function(lastVersion, lastDocumentId) {
        // ディレクトリが無ければ作成する
        var directoryPath = makeCommitDirectory(0); ///< @todo 適切なコミットディレクトリ名を計算する
        var newVersion = lastVersion + 1;

        // 保存するファイル名を決定する
        var commitFilePath = path.join(directoryPath, createSaveFileName(uploadFile.originalname, newVersion));

        // アップロードされたファイルをコミット用ディレクトリに移動させる
        var error = fs.renameSync(uploadFile.path, commitFilePath);
        if(error) {
          throw error;
        }

        // ドキュメントを作成する
        var commitInfo = {
          name: uploadFile.originalname,
          path: commitFilePath,
          comment: comment,
          version: newVersion,
          user_name: userName,
          commit_time: new Date(),  ///< UTCで保存
        };

        // ドキュメントを保存する
        var commitInfoDoc = mongoModels.commitInfo(commitInfo);
        commitInfoDoc.save(function(error) {
          if(error) {
            throw error;
          }

          // 正常にコミットされた
          updateLatestCommitList(commitInfoDoc._id, lastDocumentId);
        });
      });
    });
  }

  /**
   * @brief コミット情報を検索
   *
   * @param fileNames ファイル名の配列
   * @param resultCallback 結果を渡すコールバック
   */
  function find(fileNames, resultCallback) {
    var query = mongoModels.latestCommitId.find({}, function(error, docs) {
      var commitDocIds = [];
      docs.forEach(function(doc) {
        commitDocIds.push(doc.commit_doc_id);
      });

      var findInfo = { _id: { $in: commitDocIds } };

      if(fileNames) {
        // 曖昧検索に対応
        var likeNames = [];
        fileNames.forEach(function(name) {
          likeNames.push(new RegExp(name.trim(), 'i'));
        });
        findInfo.name = { $in: likeNames };
      }

      mongoModels.commitInfo.find(findInfo, function(error, docs) {
        if(error) {
          throw error;
        }

        var result = [];
        docs.forEach(function(doc) {
          var fileInfo = {
            _id: doc._id,
            name: doc.name,
            tag_names: doc.tag_names || [],
            version: doc.version,
            comment: doc.comment,
            user_name: doc.user_name,
          };
          result.push(fileInfo);
        });

        resultCallback(result);
      });
    });
  }

  /**
   * @brief タグ編集用情報を取得する
   *
   * @param fileName 対象のファイル名
   * @param resultCallback 結果を渡すコールバック
   */
  function getTagEditInfo(fileName, resultCallback) {
    var info = {
      file_tags: [],
      stock_tags: []
    };

    resultCallback(info);
  }

  /**
   * @brief タグの編集結果を適用する
   *
   * @param fileName 対象のファイル名
   * @param tagNames 適用するタグ名の配列
   * @param resultCallback 結果を渡すコールバック
   */
  function applyTagEditInfo(fileName, tagNames, resultCallback) {
    getLatestFileVersion(fileName, function(lastVersion, lastDocumentId) {
      if(lastVersion === 0) {
        resultCallback({ errorMessage: '対象のファイルは見つかりませんでした' });
        return;
      }

      mongoModels.commitInfo
        .findOneAndUpdate({ _id: lastDocumentId },
                          { tag_names: tagNames },
                          function(error, docs) {
                            if(error) {
                              throw error;
                            }

                            resultCallback({});
                          });
    });
  }

  /**
   * @brief コミットされているファイルをダウンロード
   *
   * @param documentId DBのドキュメントID
   * @param resultCallback 結果を返すコールバック
   */
  function download(documentId, resultCallback) {
    mongoModels.commitInfo.findOne({ _id: documentId }, function(error, doc) {
      resultCallback(doc.path, doc.name);
    });
  }

  /**
   * @brief バージョン番号の付いたファイルをダウンロード
   *
   * @param documentId DBのドキュメントID
   * @param resultCallback 結果を返すコールバック
   */
  function downloadWithVersion(documentId, resultCallback) {
    mongoModels.commitInfo.findOne({ _id: documentId }, function(error, doc) {
      var fileNameWithVersion = createSaveFileName(doc.name, doc.version);
      resultCallback(doc.path, fileNameWithVersion);
    });
  }

  /**
   * @brief ファイルの履歴を取得する
   *
   * @param fileName ファイル名
   * @param resultCallback 結果を返すコールバック
   */
  function history(fileName, resultCallback) {
    mongoModels.commitInfo.find({ name: fileName }, function(error, docs) {
      var result = [];

      docs.forEach(function(doc) {
        result.push({
          _id: doc._id,
          name: doc.name,
          version: doc.version,
          comment: doc.comment,
          user_neme: doc.user_name
        });
      });
      resultCallback(result);
    });
  }

  /**
   * @brief コミットされているファイルの最新のバージョン番号を取得する
   *
   * @param fileName ファイル名
   * @param successCallback 成功時に呼び出されるコールバック
   */
  function getLatestFileVersion(fileName, successCallback) {
    mongoModels.commitInfo
      .find({ name: fileName })
      .select('version')
      .sort({ version: -1})
      .limit(1)
      .exec(function(error, docs) {
        if(error) {
          throw error;
        }

        if(docs.length > 0) {
          // コミットされているファイルは見つかった
          successCallback(docs[0].version, docs[0]._id);
        } else {
          // コミットされているファイルは見つからなかった
          successCallback(0);
        }
      });
  }

  /**
   * @biref コミット用ディレクトリが無ければ作成する
   *
   * @param dirNumber ディレクトリ番号
   *
   * @return 作成されたディレクトリのパス
   */
  function makeCommitDirectory(dirNumber) {
    var isTopDirectoryExists = fs.existsSync(constants.FILE_COMMIT_TOP_DIRECTORY);
    if(!isTopDirectoryExists) {
      var topDirectoryMakeError = fs.mkdirSync(constants.FILE_COMMIT_TOP_DIRECTORY);
      if(!topDirectoryMakeError) {
        // @todo エラー処理を行う
        throw topDirectoryMakeError;
      }
    }

    var commitDirectoryPath = constants.FILE_COMMIT_TOP_DIRECTORY + '/' + dirNumber;
    var isCommitDirectoryExists = fs.existsSync(commitDirectoryPath);
    if(!isCommitDirectoryExists) {
      var commitDirectoryMakeError = fs.mkdirSync(commitDirectoryPath);
      if(commitDirectoryMakeError) {
        // @todo エラー処理を行う
        throw commitDirectoryMakeError;
      }
    }

    return commitDirectoryPath;
  }

  /**
   * @brief 保存するファイル名を生成する
   *
   * @param fileName ファイル名
   * @param version バージョン番号
   *
   * @return 保存するファイル名
   */
  function createSaveFileName(fileName, version) {
    var extName = path.extname(fileName);
    var baseName = path.basename(fileName, extName);

    return baseName + '_v' + version + extName;
  }

  /**
   * @brief 最新のコミットリストを更新する
   * 
   * @param commitInfoDocId コミットされたドキュメントのID
   * @param previousCommitInfoDocId 一つ前のコミットされているドキュメントのID、無ければundefined
   */
  function updateLatestCommitList(commitInfoDocId, previousCommitInfoDocId) {
    if(previousCommitInfoDocId) {
      // 以前のバージョンのコミットが存在するので、その参照情報ドキュメントを削除する
      mongoModels.latestCommitId
                  .findOne({ 'commit_doc_id': previousCommitInfoDocId })
                  .remove(function(error) {
                    if(error) {
                      throw error;
                    }
                  });
    }

    // 以前のバージョンのコミットは存在しないので、最新のリスト情報に追加する
    var latestCommitIdDocs = new mongoModels.latestCommitId({ commit_doc_id: commitInfoDocId });
    latestCommitIdDocs.save(function(error) {
      if(error) {
        throw error;
      }
    });
  }

  return {
    commit: commit,
    find: find,
    getTagEditInfo: getTagEditInfo,
    applyTagEditInfo: applyTagEditInfo,
    download: download,
    downloadWithVersion: downloadWithVersion,
    history: history
  };
};
