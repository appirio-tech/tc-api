"use strict";

exports.default = {
    stats: function () {
        return {
            // how often should the server write its stats to redis?
            writeFrequency: 300000,
            // what redis key(s) [hash] should be used to store stats?
            //  provide no key if you do not want to store stats
            keys: [
                'actionhero:stats'
            ]
        };
    }
};

exports.test = {
    stats: function () {
        return {
            writeFrequency: 0,
            keys: ['test:stats']
        };
    }
};
