const url = require('url');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

var recording = false;

const contentTypeHeaders = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
}

let ffmpeg = {};

module.exports = {
  handleRequest(req, res) {
    let data = [];

    const urlPath = url.parse(req.url).pathname;

    switch (urlPath) {
      case '/':
        try {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          const htmlString = fs.readFileSync('./static/index.html');
          res.end(htmlString);
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Route not found');
        }
        break;
      
      case '/api/start/':
        try {
          
          let body = {};

          req.on('data', chunk => {
            data.push(chunk);
          });
      
          req.on('end', () => {
            body = JSON.parse(data);
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            recording: true
          }));
          
          const now = new Date();
          const dateString = `${now.getMonth()}-${now.getDate()}-${now.getFullYear()}T${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;

          const fileName = dateString + '.mkv';
          const dir = './rootjuice/';

          if (!fs.existsSync(dir))
              fs.mkdirSync(dir);

          console.log('Recording...');

          ffmpeg = spawn('ffmpeg', [
              '-f', 'dshow', 
              '-i', 'video=screen-capture-recorder:audio=virtual-audio-capturer',
              '-framerate', '30',
              '-rtbufsize', '500M',
              '-vf', 'crop=1280:720:1:97',
              '-t', '1200',
              dir + fileName
          ]);

          ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });
          
          ffmpeg.on('close', (code) => {
            console.log('Stopped');
          });

        } catch(err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('There was an error: ' + err);
        }
        break;

      case '/api/stop/':
        let body = {};
        req.on('data', chunk => {
          data.push(chunk);
        });
        req.on('end', () => {
          body = JSON.parse(data);
        });
      
        ffmpeg.stdin.write('q');
        ffmpeg.stdin.end();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          recording: false
        }));
        
        break;

      default:
        try {
          const ext = path.extname(urlPath);
          res.writeHead(200, { 'Content-Type': contentTypeHeaders[ext] })
          const extString = fs.readFileSync(`./static${urlPath}`);
          res.end(extString);
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Route not found');
        }

    }
  }
}