var http = require('http'),
    fs = require("fs"),
    mime = require('mime'),
    path = require('path'),
    url = require('url'),
    db = require('./fake-db');

var ROOT = __dirname,
    initialPath;

http.createServer(function (req, res) {

    sendFile(url.parse(req.url, true).pathname, res, req);

}).listen(3000, '127.0.0.1');

console.log('Server running at http://127.0.0.1:3000/');

function errorCb(res) {

    res.statusCode = 500;
    res.end('Server error!');

}

function sendFile(filePath, res, req) {

    initialPath = filePath;

    try {
        filePath = decodeURIComponent(filePath);
    } catch (e) {
        res.statusCode = 400;
        res.end('Bad request!');
        return;
    }

    if (~filePath.indexOf('\0') != 0) {
        res.statusCode = 400;
        res.end('Bad request!');
        return;
    }

    filePath = path.normalize(path.join(ROOT, filePath));

    if (initialPath === '/') {
        filePath = path.normalize(path.join(filePath, '/views/index.html'));
    }

    fs.stat(filePath, function (err, stats) {

        var pattern;

        pattern = initialPath.match(/^\/api\/users(\/(\w+))?/);

        if (pattern && pattern[0]) {

            var body = '',
                id = pattern[2],
                file;

            if (req.method === 'GET') {

                if (id) {
                    db.getById(id, function (err, data) {
                        if (err) {
                            errorCb(res);
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.end(JSON.stringify(data));
                    });
                    return;
                }
                db.getCollection(function (err, db) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(db));
                });
                return;

            }

            if (req.method === 'POST') {

                body = '';
                req.on('readable', function () {
                        body += req.read();
                    })
                    .on('end', function () {
                        body = JSON.parse(body);
                        db.create(body, function (err, model) {
                            if (err) {
                                errorCb(res);
                                return;
                            }
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            res.end(JSON.stringify(model));
                        });
                    });
                return;

            }

            if (req.method === 'PUT') {

                body = '';
                req.
                    on('readable', function () {
                        body += req.read();
                    })
                    .on('end', function () {
                        body = JSON.parse(body);
                        db.update(body, function (err, model) {
                            if (err) {
                                errorCb(res);
                                return;
                            }
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            res.end(JSON.stringify(model));
                        });
                    });
                return;

            }

            if (req.method === 'DELETE') {

                db.remove(id, function (err) {
                    if (err) {
                        errorCb(res);
                        return;
                    }
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(db));
                });
                return;

            }

        }

        if (err) {
            res.statusCode = 404;
            res.end('File not found!');
            return;
        }

        if (stats.isFile()) {

            if (initialPath !== '/' && !/^\/public\//.test(initialPath)) {
                res.statusCode = 403;
                res.end('Access is denied!');
                return;
            }

            file = fs.createReadStream(filePath);
            res.setHeader('Content-Type', mime.lookup(filePath) + "; charset=utf-8");
            file.pipe(res);

            file.on('error', function () {
                errorCb(res);
            });

            res.on('close', function () {
                file.destroy();
            });
        }
    });
}