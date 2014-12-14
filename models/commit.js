/**
 * @brief コミット
 */
module.exports = function(mongoModels) {
  var fs = require('fs');
  var path = require('path');
  var constants = require('./constants');
  var util = require('util');
  var _ = require('lodash');
  var $ = require('jquery-deferred');
  require('date-utils');

  var commonConstant = require('../public/javascripts/common/constant.js');

  /**
   * @brief コミットの安全性をチェックする
   *
   * @param fileNames ファイル名の配列
   * @param userName コミットを行うユーザー名
   */
  function checkSafety(fileNames, userName) {
    function latestFileEditUser(fileName) {
      var d = new $.Deferred();
      
      mongoModels.util.findLatestFileCommitInfo(fileName, function(lastCommitInfo) {
        var editTagName = _(lastCommitInfo.tag_names)
          .find(function(tagName) {
            return /^edit:/.test(tagName);
          });

        if(!editTagName || editTagName === commonConstant.TAG_NAME.PREFIX.EDIT + userName) {
          // 変種中のユーザーはいないか、コミットしようとしているユーザーの編集中なら
          // コミットに問題はない
          d.resolve();
          console.log("B");
        } else {
          // 他のユーザーが編集中なので、コミットはできない
          var editUserName = editTagName.substr(commonConstant.TAG_NAME.PREFIX.EDIT.length);
          var message = fileName + "は" + editUserName + "が編集中です";

          console.log(message);
          d.reject(message);
        }
      });

      return d.promise();
    }

    var procs = _.map(fileNames, function(fileName) { 
      return latestFileEditUser(fileName);
    });

    return $.when.apply($, procs);
  }

  /**
   * @brief ファイルをコミット
   *
   * @param uploadFiles アップロードされたファイルの情報配列
   * @param comment コミットコメント
   * @param userName コミットを行ったユーザー名
   */
  function commit(uploadFiles, comment, userName) {
    uploadFiles.forEach(function(uploadFile) {
      // コミットされている同名のファイルの最新のコミット情報を取得する
      mongoModels.util.findLatestFileCommitInfo(uploadFile.originalname, function(lastCommitInfo) {
        lastCommitInfo = lastCommitInfo || { _id: null, version: 0, tag_names: [] };

        // ディレクトリが無ければ作成する
        var directoryPath = makeCommitDirectory(0); ///< @todo 適切なコミットディレクトリ名を計算する
        var newVersion = lastCommitInfo.version + 1;

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
          tag_names: lastCommitInfo.tag_names,
          comment: comment,
          version: newVersion,
          user_name: userName,
          commit_time: Date.now(),  ///< UTCで保存
        };

        // ドキュメントを保存する
        var commitInfoDoc = mongoModels.commitInfo(commitInfo);
        commitInfoDoc.save(function(error) {
          if(error) {
            throw error;
          }

          // 正常にコミットされた
          updateLatestCommitList(commitInfoDoc._id, lastCommitInfo._id, function() {
            updateLastViewFileVersion(commitInfo.user_name, commitInfo.name, commitInfo.version);
          });
        });
      });
    });
  }

  /**
   * @brief コミット情報を検索
   *
   * @param findProvision 検索条件
   * @param resultCallback 結果を渡すコールバック
   */
  function find(findProvision, resultCallback) {
    mongoModels.latestCommitId.find({}, function(error, docs) {
      if(error) {
        throw error;
      }

      var commitDocIds = _.pluck(docs, 'commit_doc_id');
      var findQuery = createCommitInfoFindQuery(commitDocIds, findProvision);

      mongoModels.commitInfo.find(findQuery, function(error, commitInfoDocs) {
        if(error) {
          throw error;
        }

        // 最後に確認したファイルのバージョン情報も含める
        mongoModels
          .userLastViewCommitVersion
          .findOne({ user_name: findProvision.userName }, function(error, lastViewDoc) {
            var result = _.map(commitInfoDocs, function(doc) {
              var lastViewVersion = 0;
              if(lastViewDoc) {
                var lastViewFileInfo = _.find(lastViewDoc.last_views, function(fileInfo) { return (fileInfo.file_name === doc.name); });
                lastViewVersion = (lastViewFileInfo) ? (lastViewFileInfo.version) : (0);
              }

              return {
                _id: doc._id,
                name: doc.name,
                tag_names: doc.tag_names || [],
                version: doc.version,
                comment: doc.comment,
                commit_user_name: doc.user_name,
                commit_time: new Date(doc.commit_time).toFormat('YYYY/MM/DD HH24:MI'),
                user_last_view_version: lastViewVersion
              };
            });

            resultCallback(result);
          });
      });
    });
  }

  /**
   * @brief 検索条件から、コミット情報の検索クエリーを生成する
   *
   * @param commitDocIds 検索対象のドキュメントID
   * @param findProvision 検索条件
   *
   * @return 検索クエリー
   */
  function createCommitInfoFindQuery(commitDocIds, findProvision) {
      var findQuery = { _id: { $in: commitDocIds } };

      // 曖昧検索に対応
      if(findProvision.fileNames.length > 0) {
        var likeNames = _.map(findProvision.fileNames, function(name) {
          return new RegExp(name.trim(), 'i');
        });
        findQuery.name = { $in: likeNames };
      }

      // 必ず含むタグを設定
      if(findProvision.inclusionAllTagNames.length > 0) {
        findQuery.tag_names = findQuery.tag_names || {};
        findQuery.tag_names.$all = findProvision.inclusionAllTagNames;
      }

      // いずれかを含むタグを設定
      if(findProvision.inclusionAnyTagNames.length > 0) {
        findQuery.tag_names = findQuery.tag_names || {};
        findQuery.tag_names.$in = findProvision.inclusionAnyTagNames;
      }

      // 除外するタグを設定
      if(findProvision.exclusionTagNames.length > 0) {
        findQuery.tag_names = findQuery.tag_names || {};
        findQuery.tag_names.$nin = findProvision.exclusionTagNames;
      }

      return findQuery;
  }

  /**
   * @brief コミットされているファイルをダウンロード
   *
   * @param user ダウンロードを行うユーザー
   * @param documentId DBのドキュメントID
   * @param resultCallback 結果を返すコールバック
   */
  function download(user, documentId, resultCallback) {
    mongoModels.commitInfo.findOne({ _id: documentId }, function(error, downloadDoc) {
      resultCallback(downloadDoc.path, downloadDoc.name);

      updateLastViewFileVersion(user, downloadDoc.name, downloadDoc.version);
    });
  }

  /**
   * @brief 最後に確認したファイルのバージョンを更新する
   *
   * @param userName 確認したユーザー名
   * @param fileName 確認したファイル名
   * @param fileVersion 確認したファイルのバージョン
   */
  function updateLastViewFileVersion(userName, fileName, fileVersion) {
      mongoModels
        .userLastViewCommitVersion
        .findOne({ user_name: userName }, function(error, foundDoc) {
          if(error) {
            throw error;
          }

          if(foundDoc) {
            // ユーザーの最後に確認したファイルの情報が見つかった
            var updateDoc = foundDoc;
            var isUpdated = false;
            updateDoc.last_views.forEach(function(view) {
              if(view.file_name === fileName) {
                view.version = fileVersion;
                isUpdated = true;
              }
            });

            if(!isUpdated) {
              updateDoc.last_views.push({ file_name: fileName, version: fileVersion });
            }

            // 既存のドキュメントを削除
            mongoModels
              .userLastViewCommitVersion
              .findByIdAndRemove(foundDoc._id, function(error) {
                if(error) {
                  throw error;
                }

                // 新しくドキュメントを保存
                var newModel = new mongoModels.userLastViewCommitVersion(updateDoc);
                newModel.save();
              });
          } else {
            // ユーザーの最後に確認したファイルの情報は見つからなかった
            var newDoc = {
              user_name: userName,
              last_views: [{ file_name: fileName, version: fileVersion }]
            };
            var newModel = new mongoModels.userLastViewCommitVersion(newDoc);
            newModel.save();
          }
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
      if(error) {
        throw error;
      }

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
      if(error) {
        throw error;
      }

      var result = [];

      docs.forEach(function(doc) {
        result.push({
          _id: doc._id,
          name: doc.name,
          version: doc.version,
          comment: doc.comment,
          user_name: doc.user_name,
          commit_time: new Date(doc.commit_time).toFormat('YYYY/MM/DD HH24:MI')
        });
      });
      resultCallback(result);
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
   * @param resultCallback 結果を渡すコールバック
   */
  function updateLatestCommitList(commitInfoDocId, previousCommitInfoDocId, resultCallback) {
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

      resultCallback();
    });
  }

  return {
    checkSafety: checkSafety,
    commit: commit,
    find: find,
    download: download,
    downloadWithVersion: downloadWithVersion,
    history: history
  };
};
