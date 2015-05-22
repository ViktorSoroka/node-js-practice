var http = require('http'),
    fs = require("fs"),
    mime = require('mime'),
    path = require('path'),
    url = require('url');

var ROOT = __dirname,
    initialPath;

http.createServer(function (req, res) {
    sendFile(url.parse(req.url).pathname, res);
}).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000/');


function sendFile(filePath, res) {
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

        if (err || !stats.isFile()) {
            if (initialPath !== '/' && !/^\/public\//.test(initialPath)) {
                res.statusCode = 403;
                res.end('access is denied!');
                return;
            }
            res.statusCode = 404;
            res.end('File not found!');
            return;
        }

        fs.readFile(filePath, function (err, content) {
            if (err) throw err;

            var contentType = mime.lookup(filePath);
            res.setHeader('Content-Type', contentType + "; charset=utf-8");
            res.end(content);
        });

    })
}
