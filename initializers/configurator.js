/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author kohata
 */
"use strict";

exports.configurator = function (api, next) {

    api.configurator = {
        _start: function (api, next) {
            this.configWeb(api);
            next();
        },
        configWeb: function (api) {
            if (!api.servers || !api.servers.servers.web || !api.servers.servers.web.server) {
                api.log('[configurator] web server has not been created.', 'warning');
                return;
            }

            var timeout = api.config.servers.web.timeout || 10 * 60 * 1000;

            api.servers.servers.web.server.timeout = timeout;
            api.log('[configurator] web.server#timeout => ' + timeout, 'info');
        }
    };

    next();
};
