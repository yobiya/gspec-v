/// <reference path="../../../typings/lodash/lodash.d.ts" />
/// <reference path="../../../typings/jquery/jquery.d.ts" />

/**
 * @brief コミット
 */
import _ = require('lodash');
var $ = require('jquery-deferred');

import commonConstant = require('../_common/constant');
import MM = require('../models/mongo_model');

var _mongoModels: MM.MongoModel;

export function setup(mongoModels: MM.MongoModel): void {
  _mongoModels = mongoModels;
}

/**
 * @brief タグ編集用情報を取得する
 *
 * @param fileName 対象のファイル名
 * @param resultCallback 結果を渡すコールバック
 */
export function getTagEditInfo(userName, fileName, resultCallback): void {
  _mongoModels.findLatestFileVersion(fileName, function(lastVersion, lastDocumentId) {
    if(lastVersion === 0) {
      resultCallback({ errorMessage: '対象のファイルは見つかりませんでした' });
      return;
    }

    _mongoModels
      .commitInfo
      .findById(lastDocumentId, function(error, doc) {
        findAllLatestTagNames(function(tagNames) {
          tagNames = _.reject(tagNames, function(tagName) {
            return (<any>/^edit:/).test(tagName);
          });
          tagNames.push('edit:' + userName);

          var info = {
            file_tags: doc.tag_names,
            stock_tags: _.difference(tagNames, doc.tag_names)
          };

          resultCallback(info);
        });
      });
  });
}

/**
 * @brief タグの編集結果を適用する
 *
 * @param fileName 対象のファイル名
 * @param tagNames 適用するタグ名の配列
 * @param resultCallback 結果を渡すコールバック
 */
export function applyTagEditInfo(fileName, tagNames, resultCallback): void {
  _mongoModels.findLatestFileVersion(fileName, function(lastVersion, lastDocumentId) {
    if(lastVersion === 0) {
      resultCallback({ errorMessage: '対象のファイルは見つかりませんでした' });
      return;
    }

    _mongoModels
      .commitInfo
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
 * @brief タグを追加する
 *
 * @param commitDocumentId タグを追加するコミットドキュメントのID
 * @param addTagNames 追加するタグ名
 *
 * @return deferredオブジェクト
 */
export function addTags(commitDocumentId, addTagNames): JQueryPromise<any> {
  return (function() {
    var d = $.Deferred();

    _mongoModels
      .commitInfo
      .findById(commitDocumentId, function(error, doc) {
        if(error) {
          d.reject(error);
          return;
        }

        d.resolve(doc.tag_names);
      });

    return d.promise();
  })()
  .then(function(baseTagNames: string) {
    var d = $.Deferred();

    var newTagNames = _.uniq(baseTagNames.concat(addTagNames));

    _mongoModels
      .commitInfo
      .findOneAndUpdate({ _id: commitDocumentId },
                        { tag_names: newTagNames },
                        function(error, docs) {
                          if(error) {
                            d.reject(error);
                            return;
                          }

                          d.resolve();
                        });

    return d.promise();
  });
}

/**
 * @brief 最新のコミット情報のタグを全て取得する
 *
 * @param resultCallback 結果を渡すコールバック
 */
export function findAllLatestTagNames(resultCallback): void {
  _mongoModels.latestCommitId.find({}, function(error, docs) {
    var commitDocIds = _.pluck(docs, (<any>function(doc) { return doc.commit_doc_id; }));
    var findInfo = { _id: { $in: commitDocIds } };

    _mongoModels.commitInfo.find(findInfo, function(error, docs) {
      if(error) {
        throw error;
      }

      // @todo タグの定義をクライアント側と共通化する
      var tagNames = _(docs)
                      .pluck('tag_names')
                      .flatten()
                      .value();

      // システムタグを追加する
      tagNames.push(commonConstant.TAG_NAME.CLOSED);

      // 個人タグを追加する
      _mongoModels.users.find({}, function(error, userDocs) {
        var personalTagNames = _(userDocs)
                                .pluck('name')
                                .map(function(name) { return commonConstant.TAG_NAME.PREFIX.PERSONAL + name; })
                                .value();
        var allTagNames = _.uniq(tagNames.concat(personalTagNames));

        resultCallback(allTagNames);
      });
    });
  });
}
