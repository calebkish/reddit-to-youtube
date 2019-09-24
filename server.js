const http = require('http');
const router = require('./routes');

http.createServer(router.handleRequest).listen(8000);