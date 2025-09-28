var http = require('http');
var fs = require('fs');
var path = require('path');

const PORT = 80;

// Create HTTP server
http.createServer(function (request, response) {
    // Parse the requested URL
    const url = request.url;

    // Set default to index.html if root is requested
    let filePath = url === '/' ? '/index.html' : url;
    // Add the directory prefix
    filePath = path.join(__dirname, filePath);

    // Специальное правило для index.js, который лежит в корне проекта
    if (url === '/index.js') {
        filePath = path.join(__dirname, '..', 'index.js');
    } else {
        // Все остальные файлы ищем в www/ или относительно demo/
        filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
    }

    // Determine content type based on file extension
    let extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'application/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
    }

    // Read and serve the file
    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                // File not found
                response.writeHead(404);
                response.end('404 Not Found: ' + url);
            } else {
                // Some other error
                response.writeHead(500);
                response.end('500 Internal Error: ' + error.code);
            }
        } else {
            // Successfully read the file
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(PORT, function () {
    console.log(new Date().toJSON() + ' Server started successfully on port ' + PORT);
});
