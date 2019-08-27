const CACHE_STATIC_NAME = 'static-V1';
const CACHE_DYNAMIC_NAME = 'dynamic-V1';
// importScripts('./PWA/js/idb.js');
// importScripts('./PWA/js/utility.js');

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/index.js',
                '/lazysizes.js',
                '/PWA/js/promise.js',
                '/PWA/js/fetch.js',
                '/PWA/js/idb.js',
                'https://use.fontawesome.com/releases/v5.9.0/css/all.css',
                'https://use.fontawesome.com/releases/v5.9.0/css/v4-shims.css'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', (event) => {
    var url = 'http://localhost:3000/posts';
    if (event.request.url.indexOf(url) >= -1) {
        event.respondWith(
            fetch(event.request).then(response => {
                var clonedRes = response.clone();
                // clonedRes.json().then(data => {
                //     for (let key in data.data.posts) {
                //         createPosts('posts', data.data.posts[key]);
                //     }
                // });
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
                            return caches.open(CACHE_STATIC_NAME).then(cache => {
                                return cache.match('./offline.html');
                            });
                        });
                }
            })
        );
    }
});