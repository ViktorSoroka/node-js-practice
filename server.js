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
        var pattern = initialPath.match(/^\/api\/users(\/(\w+))?/);
        if (pattern && pattern[0]) {
            var body = '',

                id = pattern[2];

            if (req.method === 'GET') {
                id = pattern[2];
                if (id) {
                    db.getById(id, function (err, data) {
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
                req
                    .on('readable', function () {
                        body += req.read();
                    })
                    .on('end', function () {
                        body = JSON.parse(body);
                        db.create(body, function () {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            res.end(JSON.stringify(db));
                        });
                    });
                return;
            }

            if (req.method === 'PUT') {

                body = '';
                req
                    .on('readable', function () {
                        body += req.read();
                    })
                    .on('end', function () {
                        body = JSON.parse(body);
                        db.update(body, function () {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            res.end(JSON.stringify(db));
                        });
                    });
                return;
            }

            if (req.method === 'DELETE') {
                db.remove(id, function () {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(db));
                });
                return;
            }
        }

        if (err) {
            res.statusCode = 404;
            res.end('Not found');
            return;
        }

        if (stats.isFile()) {
            if (initialPath !== '/' && !/^\/public\//.test(initialPath)) {
                res.statusCode = 403;
                res.end('access is denied!');
                return;
            }

            var file = fs.createReadStream(filePath);
            var contentType = mime.lookup(filePath);
            res.setHeader('Content-Type', contentType + "; charset=utf-8");
            file.pipe(res);

            file.on('error', function () {
                res.statusCode = 500;
                res.end('Server error!');
                console.log('Server error!');
            });

            file.on('close', function () {
                res.statusCode = 200;
                res.end('ee');
            });

            file.on('end', function () {
                res.statusCode = 200;
                res.end('ee');
            });

            res.on('close', function () {
                file.destroy();
            });

            //another variant of stream
            //fs.readFile(filePath, function (err, content) {
            //    if (err) throw err;
            //
            //    var contentType = mime.lookup(filePath);
            //    res.setHeader('Content-Type', contentType + "; charset=utf-8");
            //    res.end(content);
            //});
        }
    });
}