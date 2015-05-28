var https = require('https');
var _ = require('underscore');
var Pushbullet = require('pushbullet');

var config = require('./config');
var FACEBOOK_APP_VERSION = 'v2.3';
var pusher = new Pushbullet(config.pushbullet.accessToken);

var readNotifsHash = {};
var app = {
    run: function () {
        var reqOpts = {
            hostname: 'graph.facebook.com',
            path: '/' + FACEBOOK_APP_VERSION + '/me/notifications?access_token=' + config.facebook.userAccessToken,
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
                        if (readNotifsHash[n.id]) {
                            return;
                        }
                        pusher.note(config.pushbullet.device, 'Facebook', n.title, function(error, response) {});
                        readNotifsHash[n.id] = true;
                    });
                }
                app.schedule();
            }).on('error', function () {
                console.log('Error!');
            });
        }).end();
    },

    schedule: function (millis) {
        millis = millis || 10000
        setTimeout(app.run, millis);
    }
};

module.exports = {
    start: function () {
        app.schedule(1);
    }
};
