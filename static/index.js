var mediaEnded = false;

var videoStart = false;

var globalSubreddit = config.globalSubreddit;

var submissionIds;
var submission;

var ended = false;

var startDelaySeconds = config.startDelaySeconds;
var submissionTimeMinutes = config.submissionTimeMinutes;
var endScreenSeconds = config.endScreenSeconds;

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

var postGifElement = document.querySelector('.jsgif');
var postVideoElement = document.getElementById('post-video');
var postAudioElement = document.getElementById('post-audio');

postAudioElement.volume = 0.5;

const chooseRandomVideo = () => {
    var element = document.getElementById('video');

    if (config.spooky) {
        var rand = Math.floor(Math.random() * 6);
        element.src = 'videos/spooky/' + rand + '.mp4';
    } else {
        var rand = Math.floor(Math.random() * 10);
        element.src = 'videos/' + rand + '.mp4';
    }
}

const chooseRandomSong = () => {
    var element = document.getElementById('audio');

    if (config.spooky) {
        var rand = Math.floor(Math.random() * 4);
        element.src = 'music/spooky/' + rand + '.mp3';
    } else {
        var rand = Math.floor(Math.random() * 55);
        element.src = 'music/' + rand + '.mp3';
    }
    
    element.volume = 0.2;
}

const formatMessage = message => {
    message = message.replace(/(?:__|[*#])|\[(.*?)\]\(.*?\)/gm, '$1');
    message = message.replace(/&gt;!|!&lt;|\\|&gt;|&lt;|&amp;|x200B;|&x200B/g, '');
    message = message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    return message;
}

const stringToHtml = html => {
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

const getSubmissionData = async(submissionId) => {
    var res = await fetch('http://www.reddit.com/' + submissionId + '/.json');
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

    body = await formatMessage(body);
    bodyHtml = await stringToHtml(bodyHtml);

    var sentences = body.split('\n\n');
    var htmlSentences = bodyHtml.innerHTML.split('\n\n');

    var bodyElement = document.createElement('p');
    bodyElement.className = 'md';

    commentElement.insertBefore(bodyElement, replyElement);
    
    commentElement.style.display = 'block';

    if (commentElement.offsetHeight > 687) {
        commentElement.removeChild(commentElement.children[2]);
        return;
    } else {
        commentElement.style.visibility = 'visible';
    }

    for (var i=0; i < sentences.length; i++) {
        await (async() => {
            return new Promise((resolve, reject) => {
                var msg = new SpeechSynthesisUtterance();
                if (config.spooky) msg.pitch = 0;
                msg.text = sentences[i];
                bodyElement.innerHTML += htmlSentences[i];
                
                if ((canvasElement.offsetHeight - 140) < wrapperElement.offsetHeight) {
                    canvasElement.style.alignItems = 'end';
                }

                msg.addEventListener('end', function() {
                    if (ended && (sentences[i] === sentences[sentences.length-1])) {
                        wrapperElement.style.display = 'none';

                        setTimeout(function() {
                            if (config.record) {
                                fetch('http://localhost:8000/api/stop/', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        time: 10
                                    })
                                }).catch(err => {
                                    console.log(err);
                                });
                            }
    
                            nextSubmission();
                        }, endScreenSeconds * 1000);
                    }
                    
                    resolve();
                });
    
                window.speechSynthesis.speak(msg);
            });
        })();
    }

    if (repliesData !== null && repliesData[0].data.body !== undefined) {
        
        var replyBody = repliesData[0].data.body;
        
        if ((!ended) && (replyBody !== '[deleted]') && (replyBody !== '[removed]'))
            await readReply(repliesData);
    }
        

    commentElement.removeChild(commentElement.children[2]);
    commentElement.style.display = 'none';
    commentElement.style.visibility = 'hidden';
    canvasElement.style.alignItems = 'center';
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

    body = await formatMessage(body);
    bodyHtml = await stringToHtml(bodyHtml);

    var sentences = body.split('\n\n');
    var htmlSentences = bodyHtml.innerHTML.split('\n\n');

    var bodyElement = document.createElement('p');
    bodyElement.className = 'md';

    replyElement.insertBefore(bodyElement, rtrElement);
        
    replyElement.style.display = 'block';

    if (replyElement.offsetHeight > 687) {
        replyElement.removeChild(replyElement.children[2]);
        return;
    } else {
        replyElement.style.visibility = 'visible';
    }
    
    for (var i=0; i < sentences.length; i++) {
        await (async() => {
            return new Promise((resolve, reject) => {
                var msg = new SpeechSynthesisUtterance();
                if (config.spooky) msg.pitch = 0;
                msg.text = sentences[i];
                bodyElement.innerHTML += htmlSentences[i];

                if ((canvasElement.offsetHeight - 140) < wrapperElement.offsetHeight) {
                    canvasElement.style.alignItems = 'end';
                }

                msg.addEventListener('end', function() {
                    if (ended && (sentences[i] === sentences[sentences.length-1])) {
                        wrapperElement.style.display = 'none';

                        setTimeout(function() {
                            if (config.record) {
                                fetch('http://localhost:8000/api/stop/', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        time: 10
                                    })
                                }).catch(err => {
                                    console.log(err);
                                });
                            }

                            nextSubmission();
                        }, endScreenSeconds * 1000);
                    }
                    
                    resolve();
                });

                window.speechSynthesis.speak(msg);
            });
        })();
    }

    if (rtr) {
        var test = await getReplies(repliesData[0]);
        await readRtr(test);
        rtr = !rtr;
    }

    replyElement.removeChild(replyElement.children[2]);
    replyElement.style.display = 'none';
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

            if ((canvasElement.offsetHeight - 140) < wrapperElement.offsetHeight) {
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

var getReplies = async(message) => {
    if (message.data.replies === '')
        return null;
    else
        return message.data.replies.data.children;
}

var readTitle = async(data) => {
    var title = data.title;
    var author = data.author;
    var subreddit = data.subreddit_name_prefixed;
    var score = data.score;
    var videoUrl = null;
    var audioUrl = null;
    var gifUrl = null;
    var gfycatUrl = null;


    titleSubredditElement.innerHTML = subreddit;
    titleAuthorElement.innerHTML = 'Posted by u/' + author;
    titleElement.innerHTML = title;
    
    var isGfycat = false;
    var isVideo = false;
    var isGif = false;

    // Test if post is a video
    if (data.media !== null || data.crosspost_parent_list !== undefined) {
        if (data.crosspost_parent_list !== undefined) {
            if (data.crosspost_parent_list[0].media && data.crosspost_parent_list[0].media.reddit_video !== undefined) {
                isVideo = true;
            }
        } else if (data.media !== null) {
            if (data.media.reddit_video !== undefined) {
                isVideo = true;
            }
        }

    }

    // Test if post is a gfycat video
    if (new RegExp(/https:\/\/gfycat.com\/[\s\S]*/g).test(data.url)) {
        isGfycat = true;
    }

    // Test if post is a gif
    if (new RegExp(/[\w\W]*.gif/g).test(data.url)) {
        isGif = true;
    }
    
    if (isGfycat) {
        gfycatUrl = data.url;

        var gfycatUrlArray = data.url.split('/');
        var gfycatId = gfycatUrlArray[gfycatUrlArray.length - 1];
        
        await fetch('https://api.gfycat.com/v1/gfycats/' + gfycatId)
            .then(res => res.json())
            .then(data => {
                gfycatUrl = data.gfyItem.mp4Url;
            });
    } else if (isVideo) {        
        if (data.crosspost_parent_list !== undefined) {
            videoUrl = data.crosspost_parent_list[0].media.reddit_video.fallback_url.split('?')[0];
        } else {
            videoUrl = data.media.reddit_video.fallback_url.split('?')[0];
        }
        
        var audioArray = videoUrl.split('/');
        audioArray.pop();
        audioUrl = audioArray.join('/') + '/audio';
    } else if (isGif) {
        gifUrl = data.url;
    } else {
        var body = data.selftext;
        var bodyHtml = data['selftext_html'];
        
        body = await formatMessage(body);
        if (bodyHtml !== null) bodyHtml = await stringToHtml(bodyHtml);

        var sentences = body.split('\n\n');
        if (bodyHtml !== null) var htmlSentences = bodyHtml.innerHTML.split('\n\n');

        var bodyElement = document.createElement('p');
        if (bodyHtml !== null) bodyElement.className = 'md';

        if (bodyHtml !== null) titleSection.appendChild(bodyElement);
    }
    
    titleSection.style.display = 'block';
    wrapperElement.style.display = 'block';

    await (async() => {
        return new Promise((resolve, reject) => {
            var msg = new SpeechSynthesisUtterance();
            if (config.spooky) msg.pitch = 0;
            msg.text = title;

            msg.addEventListener('end', function() {
                resolve();
            })

            window.speechSynthesis.speak(msg);
        })
    })();

    if (bodyHtml) {
        for (var i=0; i < sentences.length; i++) {
            await (async() => {
                return new Promise((resolve, reject) => {
                    var msg = new SpeechSynthesisUtterance();
                    msg.text = sentences[i];
                    if (config.spooky) msg.pitch = 0;
                    bodyElement.innerHTML += htmlSentences[i];
    
                    if ((canvasElement.offsetHeight - 140) < wrapperElement.offsetHeight) {
                        canvasElement.style.alignItems = 'end';
                    }
    
                    msg.addEventListener('end', function() {
                        if (ended && (sentences[i] === sentences[sentences.length-1])) {
                            wrapperElement.style.display = 'none';
                            
                            setTimeout(function() {
                                if (config.record) {
                                    fetch('http://localhost:8000/api/stop/', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            time: 10
                                        })
                                    }).catch(err => {
                                        console.log(err);
                                    });
                                }
        
                                nextSubmission();
                            }, endScreenSeconds * 1000);
                        }
                        
                        resolve();
                    });
        
                    window.speechSynthesis.speak(msg);
                });
            })();
        }
        titleSection.removeChild(titleSection.children[4]);
    } else if (videoUrl !== null) {
        await (async() => {
            return new Promise((resolve, reject) => {
                wrapperElement.style.display = 'none';
                
                var backgroundAudio = document.getElementById('audio');

                var maxTimesPlayed = 2;
                var timesPlayed = 0;
                
                postVideoElement.src = videoUrl;
                postAudioElement.src = audioUrl;

                
                
                postVideoElement.play();
                postAudioElement.play();
                
                postVideoElement.addEventListener('loadedmetadata', function() {             
                    if (postVideoElement.duration > 10) {
                        maxTimesPlayed = 1;
                    }
                });
                
                backgroundAudio.volume = 0;
                postAudioElement.onerror = function() {
                    backgroundAudio.volume = 0.2;
                }

                postVideoElement.style.display = 'block';

                postVideoElement.onended = function() { 
                    timesPlayed++;

                    if (timesPlayed < maxTimesPlayed) {
                        postVideoElement.play();
                        postAudioElement.play();
                    } else {
                        backgroundAudio.volume = 0.2;
                        mediaEnded = true;
                        postVideoElement.style.display = 'none';
                        
                        if (ended) {
                            wrapperElement.style.display = 'none';
                            
                            setTimeout(function() {
                                if (config.record) {
                                    fetch('http://localhost:8000/api/stop/', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            time: 10
                                        })
                                    }).catch(err => {
                                        console.log(err);
                                    });
                                }
                            }, endScreenSeconds * 1000);
                        } 

                        resolve();
                    }
                }
            });
        })();
    } else if (gfycatUrl !== null) {
        await (async() => {
            return new Promise((resolve, reject) => {
                wrapperElement.style.display = 'none';
                
                var maxTimesPlayed = 2;
                var timesPlayed = 0;
                
                postVideoElement.src = gfycatUrl;
                
                postVideoElement.play();
                
                postVideoElement.addEventListener('loadedmetadata', function() {             
                    if (postVideoElement.duration > 10) {
                        maxTimesPlayed = 1;
                    }
                });

                postVideoElement.style.display = 'block';

                postVideoElement.onended = function() { 
                    timesPlayed++;

                    if (timesPlayed < maxTimesPlayed) {
                        postVideoElement.play();
                        postAudioElement.play();
                    } else {
                        mediaEnded = true;
                        postVideoElement.style.display = 'none';
                        
                        if (ended) {
                            wrapperElement.style.display = 'none';
                            
                            setTimeout(function() {
                                if (config.record) {
                                    fetch('http://localhost:8000/api/stop/', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            time: 10
                                        })
                                    }).catch(err => {
                                        console.log(err);
                                    });
                                }
                            }, endScreenSeconds * 1000);
                        } 

                        resolve();
                    }
                }
            });
        })();
    } else if (gifUrl !== null) {        
        await (async() => {
            return new Promise((resolve, reject) => {
                wrapperElement.style.display = 'none';

                postGifElement.src = gifUrl;
                postGifElement.style.display = 'flex';

                var superGif = new SuperGif({
                    gif: postGifElement,
                    on_end: function(postGifELement) {
                        console.log('in here');
                        
                        mediaEnded = true;
                        console.log(postGifELement);
                        postGifElement.style.display = 'none';
                        
                        if (ended) {
                            wrapperElement.style.display = 'none';
                            
                            setTimeout(function() {
                                if (config.record) {
                                    fetch('http://localhost:8000/api/stop/', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            time: 10
                                        })
                                    }).catch(err => {
                                        console.log(err);
                                    });
                                }
                            }, endScreenSeconds * 1000);
                        } 

                        resolve();
                    },
                    loop_mode: false,
                    progressbar_height: 0
                });

                superGif.load(function() {
                    console.log('loaded');
                });
            });
        })();
    }

    titleSection.style.display = 'none';
    canvasElement.style.alignItems = 'center';
}





var transcribeSubmission = async(submissionId) => {
    var submissionData = await getSubmissionData(submissionId);


    if (submissionData[0] === undefined) {
        wrapperElement.style.display = 'none';
        
        setTimeout(function() {
            if (config.record) {
                fetch('http://localhost:8000/api/stop/', {
                    method: 'POST',
                    body: JSON.stringify({
                        time: 10
                    })
                }).catch(err => {
                    console.log(err);
                });
            }
        }, endScreenSeconds * 1000);
    } else {
        var postData = submissionData[0].data.children[0].data;

        setTimeout(async function() {
            await readTitle(postData);
            // postData.media && postData.media.reddit_video.fallback_url
            if (postData.media !== null || postData.crosspost_parent_list !== undefined) {
                if (!ended)
                    nextSubmission();
            } else if (new RegExp(/https:\/\/gfycat.com\/[\s\S]*/g).test(postData.url)) {
                if (!ended)
                    nextSubmission();
            } else {
                wrapperElement.style.display = 'block';

                var comments = submissionData[1].data.children;

                for (var i=0; i < comments.length; i++) {
                    var commentBody = comments[i].data.body;
                    if ((!ended) && (commentBody !== '[deleted]') && (commentBody !== '[removed]'))
                        await readComment(comments[i]);
                }
                
                
            }
            
        }, (videoStart) ? 1000 : config.startDelaySeconds * 1000);
    }
}





var startNewSubmission = async (submission) => {
    if (!videoStart || !config.continuous) {
        chooseRandomSong();
        chooseRandomVideo();

        var seconds = 60 * submissionTimeMinutes;
        var display = document.getElementById('timer');
        startTimer(seconds, display);
    }

    ended = false;

    await transcribeSubmission(submission);

    videoStart = true;
}






document.getElementById('start').addEventListener('click', async(e) => {
    ended = false;

    if (config.useCustomSubmissions) {
        submissionIds = config.submissionIds;
    } else {
        submissionIds = await getSubmissions(globalSubreddit);
        submissionIds.shift();
    }

    if (config.record) {
        fetch('http://localhost:8000/api/start/', {
            method: 'POST',
            body: JSON.stringify({
                time: 10
            })
        }).catch(err => {
            console.log(err);
        });   
    }

    submission = submissionIds[0];
    
    nextSubmission();
});







function nextSubmission() {
    startNewSubmission(submission);
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