const fs = require('fs');

let files = fs.readdirSync('static/music/');

for (let i=0; i < files.length; i++) {
    fs.rename('./static/music/' + files[i], './static/music/' + i + '.mp3', function(err) {
        if (err) console.log(err);
    })
}