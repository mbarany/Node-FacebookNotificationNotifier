var https = require('https');
var _ = require('underscore');
var Pushbullet = require('pushbullet');

var FACEBOOK_APP_VERSION = 'v2.3';

var App = function (config) {
    this.config = config;
    this.pusher = new Pushbullet(config.pushbullet.accessToken);
    this.readNotifsHash = {};
};

App.prototype.run = function () {
    var self = this;
    var reqOpts = {
        hostname: 'graph.facebook.com',
        path: '/' + FACEBOOK_APP_VERSION + '/me/notifications?access_token=' + self.config.facebook.userAccessToken,
        method: 'GET'
    };

    https.request(reqOpts, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        }).on('end', function () {
            if (res.statusCode !== 200) {
                console.log('Error contacting Facebook!', body);
                return;
            }
            var fbResponse = JSON.parse(body)
            var notifs = fbResponse.data;
            if (notifs && notifs.length) {
                _(notifs).each(function (n) {
                    if (self.readNotifsHash[n.id]) {
                        return;
                    }
                    self.pusher.note(self.config.pushbullet.device, 'Facebook', n.title, function(error, response) {});
                    self.readNotifsHash[n.id] = true;
                });
            }
            self.schedule();
        }).on('error', function () {
            console.log('Error!');
        });
    }).end();
};

App.prototype.schedule = function (millis) {
    var self = this;
    millis = millis || 10000
    setTimeout(function () {
        self.run();
    }, millis);
};

module.exports = {
    start: function (_config) {
        var app = new App(_config);
        app.schedule(1);
    }
};
