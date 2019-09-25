const fs = require('fs');

let files = fs.readdirSync('static/videos/');

for (let i=0; i < files.length; i++) {
    fs.rename('./static/videos/' + files[i], './static/videos/' + i + '.mp4', function(err) {
        if (err) console.log(err);
    })
}