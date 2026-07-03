const CACHE_NAME = 'teaching-toolbox-v1';
const ASSETS_TO_CACHE = [
    '/教学工具箱.html',
    '/manifest.json',
    '/sounds/card_flip.mp3',
    '/sounds/card_win.mp3',
    '/sounds/card_fly.mp3',
    '/sounds/scratch.mp3',
    '/sounds/reveal.mp3'
];

// 安装事件 - 缓存资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 请求拦截 - 从缓存加载或网络请求
self.addEventListener('fetch', (event) => {
    // 跳过非GET请求
    if (event.request.method !== 'GET') return;
    
    // 跳过chrome-extension和其他非http请求
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 如果缓存存在，返回缓存
                if (cachedResponse) {
                    // 异步更新缓存
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, networkResponse));
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                // 否则从网络请求
                return fetch(event.request)
                    .then((networkResponse) => {
                        // 检查是否有效
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // 缓存响应
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // 离线时返回离线页面（如果有）
                        return caches.match('/教学工具箱.html');
                    });
            })
    );
});

// 处理推送通知（预留）
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || '您有一条新消息',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="%231a1a2e"/><text x="96" y="130" font-size="100" text-anchor="middle">🧰</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="%231a1a2e"/><text x="96" y="130" font-size="100" text-anchor="middle">🧰</text></svg>',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/教学工具箱.html'
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title || '教学工具箱', options)
        );
    }
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/教学工具箱.html')
    );
});
