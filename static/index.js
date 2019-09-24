var globalSubreddit = 'AskReddit';

var submissionIds;
var submission;

var ended = false;

var startDelaySeconds = 2;
var submissionTimeMinutes = 10;
var endScreenSeconds = 15;

var rtr = false;
document.getElementById('replytoreply').addEventListener('click', e => {
    e.preventDefault();

    rtr = true;
});

var canvasElement = document.getElementById('canvas');
var wrapperElement = document.getElementById('wrapper');

var titleSection = document.getElementById('title-section');

var titleSubredditElement = document.getElementById('title__subreddit');
var titleAuthorElement = document.getElementById('title__author');
var titleElement = document.getElementById('title');

var commentElement = document.getElementById('comment');
var commentAuthorElement = document.getElementById('comment__author');
var commentScoreElement = document.getElementById('comment__score');

var replyElement = document.getElementById('reply');
var replyAuthorElement = document.getElementById('reply__author');
var replyScoreElement = document.getElementById('reply__score');

var rtrElement = document.getElementById('rtr');
var rtrAuthorElement = document.getElementById('rtr__author');
var rtrScoreElement = document.getElementById('rtr__score');

const chooseRandomSong = () => {
    var element = document.getElementById('audio');

    var rand = Math.floor(Math.random() * 55);

    element.src = 'music/' + rand + '.mp3';
    element.volume = 0.1;
}

const formatMessage = async(message) => {
    message = message.replace(/(?:__|[*#])|\[(.*?)\]\(.*?\)/gm, '$1');

    message = message.replace(/&gt;!|!&lt;|\\|&gt;|&lt;|&amp;|x200B;|&x200B/g, '');

    message = message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');

    return message;
}

const stringToHtml = async(html) => {
	var txt = document.createElement('textarea');
    txt.innerHTML = html;

    txt.value = txt.value.replace(/&#39;/g, "'");
    txt.value = txt.value.replace(/&quot;/g, '"');

    commentHtml = new DOMParser().parseFromString(txt.value, 'text/html');

	return commentHtml.body.firstChild;
};

const getSubmissions = async(subreddit) => {
    var res = await fetch('http://www.reddit.com/r/'+ subreddit + '.json');
    res = await res.json();

    var submissionIds = res.data.children.map(submission => submission.data.id);

    return submissionIds;
}

const getSubmissionData = async(subreddit, submissionId) => {
    var res = await fetch('http://www.reddit.com/r/'+ subreddit + '/comments/' + submissionId + '/.json');
    res = await res.json();

    return res;
}

var readComment = async(commentData) => {
    var body = commentData.data.body;
    var bodyHtml = commentData.data.body_html;
    var author = commentData.data.author;
    var score = commentData.data.score;

    var repliesData = await getReplies(commentData);
    
    commentAuthorElement.innerHTML = author;
    
    if (score >= 1000)
        commentScoreElement.innerHTML = (score/1000).toFixed(1) + 'k points';
    else
        commentScoreElement.innerHTML = score + ' points';

    bodyHtml = await stringToHtml(bodyHtml);

    commentElement.insertBefore(bodyHtml, replyElement);

    body = await formatMessage(body);

    if (commentElement.offsetHeight > 687) {
        commentElement.removeChild(commentElement.children[2]);
        return;
    } else {
        commentElement.style.visibility = 'visible';
    }

    await (async() => {
        return new Promise((resolve, reject) => {
            var msg = new SpeechSynthesisUtterance();
            msg.text = body;

            msg.addEventListener('end', function() {
                if (ended) {
                    setTimeout(function() {
                        fetch('http://localhost:8000/api/stop/', {
                            method: 'POST',
                            body: JSON.stringify({
                                time: 10
                            })
                        }).catch(err => {
                            console.log(err);
                        });

                        nextSubmission();
                    }, endScreenSeconds * 1000);
                }
                
                resolve();
            });

            window.speechSynthesis.speak(msg);
        });
    })();

    if (repliesData !== null && repliesData[0].data.body !== undefined) {
        
        var replyBody = repliesData[0].data.body;
        
        if ((!ended) && (replyBody !== '[deleted]') && (replyBody !== '[removed]'))
            await readReply(repliesData);
    }
        

    commentElement.removeChild(commentElement.children[2]);
    commentElement.style.visibility = 'hidden';
}

var readReply = async(repliesData) => {
    var author = repliesData[0].data.author;
    var score = repliesData[0].data.score;
    var body = repliesData[0].data.body;
    var bodyHtml = repliesData[0].data.body_html;
    
    replyAuthorElement.innerHTML = author;

    if (score >= 1000)
        replyScoreElement.innerHTML = (score/1000).toFixed(1) + 'k points';
    else
        replyScoreElement.innerHTML = score + ' points';

    bodyHtml = await stringToHtml(bodyHtml);

    replyElement.insertBefore(bodyHtml, rtrElement);

    body = await formatMessage(body);

    if (replyElement.offsetHeight > 687) {
        replyElement.removeChild(replyElement.children[2]);
        return;
    } else {
        replyElement.style.visibility = 'visible';
    }
    
    await (async() => {
        return new Promise((resolve, reject) => {
            var msg = new SpeechSynthesisUtterance();
            msg.text = body;

            if (canvasElement.offsetHeight < wrapperElement.offsetHeight) {
                canvasElement.style.alignItems = 'end';
            }

            msg.addEventListener('end', function() {
                if (ended) {
                    setTimeout(function() {
                        fetch('http://localhost:8000/api/stop/', {
                            method: 'POST',
                            body: JSON.stringify({
                                time: 10
                            })
                        }).then(res => {
                            
                        }).catch(err => {
                            console.log(err);
                        });

                        nextSubmission();
                    }, endScreenSeconds * 1000);
                }
                
                resolve();
            });

            window.speechSynthesis.speak(msg);
        });
    })();

    if (rtr) {
        var test = await getReplies(repliesData[0]);
        await readRtr(test);
        rtr = !rtr;
    }

    replyElement.removeChild(replyElement.children[2]);
    replyElement.style.visibility = 'hidden';
    canvasElement.style.alignItems = 'center';
}

var readRtr = async(rtrData) => {
    var author = rtrData[0].data.author;
    var score = rtrData[0].data.score;
    var body = rtrData[0].data.body;
    var bodyHtml = rtrData[0].data.body_html;
    
    rtrAuthorElement.innerHTML = author;

    if (score >= 1000)
        rtrScoreElement.innerHTML = (score/1000).toFixed(1) + 'k points';
    else
        rtrScoreElement.innerHTML = score + ' points';
    

    rtrElement.style.display = 'block';

    bodyHtml = await stringToHtml(bodyHtml);

    rtrElement.appendChild(bodyHtml);

    body = await formatMessage(body);
    
    await (async() => {
        return new Promise((resolve, reject) => {
            var msg = new SpeechSynthesisUtterance();
            msg.text = body;

            if (canvasElement.offsetHeight < wrapperElement.offsetHeight) {
                canvasElement.style.alignItems = 'end';
            }

            msg.addEventListener('end', function() {
                resolve();
            });

            window.speechSynthesis.speak(msg);
        });
    })();

    rtrElement.removeChild(rtrElement.lastElementChild);
    rtrElement.style.display = 'none';
    canvasElement.style.alignItems = 'center';
}

var readTitle = async(title, author, subreddit) => {
    titleSubredditElement.innerHTML = subreddit;
    titleAuthorElement.innerHTML = 'Posted by u/' + author;
    titleElement.innerHTML = title;

    titleSection.style.display = 'block';

    await (async() => {
        return new Promise((resolve, reject) => {
            var msg = new SpeechSynthesisUtterance();
            msg.text = title;

            msg.addEventListener('end', function() {
                resolve();
            })

            window.speechSynthesis.speak(msg);
        })
    })();

    titleSection.style.display = 'none';
}

var getReplies = async(message) => {
    if (message.data.replies === '')
        return null;
    else
        return message.data.replies.data.children;
}

var transcribeSubmission = async(subreddit, submissionId, commentAmount) => {
    var submissionData = await getSubmissionData(subreddit, submissionId);

    var submissionTitle = submissionData[0].data.children[0].data.title;
    var submissionAuthor = submissionData[0].data.children[0].data.author;
    var submissionSubreddit = submissionData[0].data.children[0].data.subreddit_name_prefixed;
    var submissionScore = submissionData[0].data.children[0].data.score;

    fetch('http://localhost:8000/api/start/', {
        method: 'POST',
        body: JSON.stringify({
            time: 10
        })
    }).catch(err => {
        console.log(err);
    });

    setTimeout(async function() {
        await readTitle(submissionTitle, submissionAuthor, submissionSubreddit);

        var comments = submissionData[1].data.children;

        for (var i=0; i < comments.length; i++) {
            var commentBody = comments[i].data.body;
            if ((!ended) && (commentBody !== '[deleted]') && (commentBody !== '[removed]'))
                await readComment(comments[i]);
        }
    }, startDelaySeconds * 1000);
    
}

var processSubmission = async (submission) => {
    chooseRandomSong();

    var seconds = 60 * submissionTimeMinutes;
    var display = document.getElementById('timer');
    startTimer(seconds, display);

    ended = false;

    await transcribeSubmission(globalSubreddit, submission, 50 );
}

document.getElementById('start').addEventListener('click', async(e) => {
    ended = false;

    submissionIds = await getSubmissions(globalSubreddit);

    submissionIds = [
        // 'd3r4qy',
        // 'd3a6dr',
        // 'a72nr4',
        // 'chm4um',
        // 'cj95jb',
        // 'bhd99l',
        // 'akbzuv',
        'cy82ym',
        'cpsi27',
        'a0a4cd',
        'b0ox0w',
        'b0e6ty',
        'bvr285',
        'ayoyal',
        'coai4l',
        'auypw7'
    ];

    submission = submissionIds[0];

    nextSubmission();
});

function nextSubmission() {
    processSubmission(submission);
    submissionIds.shift();
    submission = submissionIds[0];
}

var startTimer = (duration, display) => {
    var timer = duration, minutes, seconds;

    var test = setInterval(timerFunc, 1000);

    function timerFunc() {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
            clearInterval(test);
            ended = true;
        }
    }
}