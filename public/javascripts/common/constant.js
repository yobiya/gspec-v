/**
 * @brief クライアント側とサーバー側で共通で使用する定数
 */
(function() {
  var TAG_PREFIX_SYSTEM = 'system:';
  var TAG_NAME = {
    PREFIX: {
      FREE: 'free:',
      PERSONAL: 'personal:',
      EDIT: 'edit:',
      SYSTEM: TAG_PREFIX_SYSTEM
    },
    CLOSED: TAG_PREFIX_SYSTEM + 'closed'
  };

  var result = {
    TAG_NAME: TAG_NAME
  };

  if(typeof window === 'undefined') {
    module.exports = result;
  } else {
    window.gspecv = window.gspecv || {};
    window.gspecv.constant = result;
  }
})();
