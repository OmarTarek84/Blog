importScripts('/js/idb.js');
importScripts('/js/utility.js');

const CACHE_STATIC_NAME = 'static-V1';
const CACHE_DYNAMIC_NAME = 'dynamic-V1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/js/index.js',
                '/js/lazysizes.js',
                '/js/promise.js',
                '/js/fetch.js',
                '/js/idb.js',
                'https://use.fontawesome.com/releases/v5.9.0/css/all.css',
                'https://use.fontawesome.com/releases/v5.9.0/css/v4-shims.css'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', (event) => {
    var url = 'https://blog-social-network.herokuapp.com';
    if (event.request.url.indexOf(url) >= -1) {
        event.respondWith(
            fetch(event.request).then(response => {
                var clonedRes = response.clone();
                if (clonedRes.url === 'https://blog-social-network.herokuapp.com/graphql') {
                    clonedRes.json().then(data => {
                        const posts = data.data.posts;
                        const users = data.data.users;
                        for (let key in posts) {
                            createData('posts', posts[key]);
                        }
                        for (let key in users) {
                            createData('users', users[key]);
                        }
                    });
                }
                return response;
            })
            // caches.open(CACHE_DYNAMIC_NAME).then(cache => {
            //     return fetch(event.request).then(res => {
            //         cache.put(event.request, res.clone());
            //         return res;
            //     });
            // })
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(res => {
                            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                                cache.put(event.request.url, res.clone());
                                return res;
                            });
                        })
                        .catch(err => {

                        });
                }
            })
        );
    }
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-new-posts') {
        event.waitUntil(
            readAllData('sync-posts')
            .then(data => {
                for (var dt of data) {
                    const formData = new FormData();
                    formData.append('image', dt.photo);
                    fetch('/insertPostImage', {
                        method: 'PUT',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': dt.token,
                        }
                    }).then(res => {
                        return res.json();
                    })
                    .then(filepath => {
                        const path = filepath.filePath;
                        const formdata = new FormData();
                        formdata.append('title', dt.title);
                        formdata.append('body', dt.body);
                        formdata.append('userId', dt.userId);
                        formdata.append('photo', path);
                        fetch('/sendSyncedPostToDB', {
                            method: 'POST',
                            body: formdata,
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': 'Bearer ' + dt.token
                            }
                        })
                        .then(res => {
                            return res.json();
                        })
                        .then(result => {
                            const newPost = result.newpost;
                            console.log(newPost);
                            deleteItemFromData('sync-posts', newPost.body);
                        });
                    })
                    .catch(err => {
                        console.log(err);
                    });
                }
            })
        );
    } else if(event.tag === 'sync-new-comments') {
        event.waitUntil(
            readAllData('sync-comments').then(data => {
                for (var dt of data) {
                    const formData = new FormData();
                    formData.append('userId', dt.userId);
                    formData.append('postId', dt.postId);
                    formData.append('comment', dt.comment);
                    fetch('/sendSyncedCommentToDB', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': dt.token
                        }
                    })
                    .then(res => {
                        return res.json();
                    })
                    .then(result => {
                        const newComment = result.newcomment;
                        console.log(newComment);
                        deleteItemFromData('sync-comments', newComment.comment);
                    });
                }
            })
        );
    }
});

self.addEventListener('message', function(event){
    var data = JSON.parse(event.data);

    self.postId = data.postId;
    self.userId = data.userId;
    self.postTitle = data.postTitle;
    self.postPhoto = data.postPhoto;
    self.userName = data.userName;
    self.comment = data.comment;
    self.userInsertedComment = data.userInsertedComment;

});

self.addEventListener('push', (event) => {
    let data;
    if (event.data) {
        data = JSON.parse(event.data.text());
    }
    if (data.notifyFrom === 'createPost') {
        var options = {
            body: data.postTitle,
            image: data.photo,
            lang: 'en-US',
            vibrate: [100, 50, 200],
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'Go To Post'},
                {action: 'cancel', title: 'Cancel'}
            ],
            icon: '/icons/app-icon-144x144.png',
            badge: '/icons/app-icon-144x144.png',
            data: {
                url: data.openUrl
            }
        };
    
        
        event.waitUntil(
            self.registration.showNotification(data.content, options)
        )
    }
    if (data.notifyFrom === 'insertedComment') {
        const options = {
            lang: 'en-US',
            vibrate: [100, 50, 200],
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'Go To Post'},
                {action: 'cancel', title: 'Cancel'}
            ],
            icon: '/icons/app-icon-144x144.png',
            badge: '/icons/app-icon-144x144.png',
            data: {
                url: data.openUrl
            }
        }
        event.waitUntil (
            self.registration.showNotification(data.content, options)
        )
    }
});

self.addEventListener('notificationclick', event => {
    var notification = event.notification;
    var action = event.action;
    if (action === 'confirm') {
        var url = 'https://blog-social-network.herokuapp.com/post';
        if (notification.data.url.indexOf(url) !== -1) {
            event.waitUntil(
                clients.matchAll().then(cli => {
                    var client = cli.find(c => {
                        return c.visibilityState === 'visible';
                    });
                    if (client) {
                        client.navigate(notification.data.url);
                        client.focus();
                    } else {
                        client.openWindow(notification.data.url);
                    }
                    notification.close();
                })
            )
        }
    } else {
        notification.close()
        console.log('cancelled');
    }
});