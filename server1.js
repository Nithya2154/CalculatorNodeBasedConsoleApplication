var http = require('http')
http.createServer(function (req, res) {
    res.writeHead(200, { "content-type": 'text/plain' });
    res.write("WElcome to a@b")
    res.end("Thank You")
}).listen(8081);