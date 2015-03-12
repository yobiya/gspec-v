define(["require", "exports"], function (require, exports) {
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
});
