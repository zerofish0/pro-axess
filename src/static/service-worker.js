self.addEventListener('install', event => {
  console.log('Pro Axess installed as PWA app');
});
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/static/icons/icon-192.png',
  });
});

self.addEventListener('fetch', event => {
  // Ici tu pourrais mettre du caching si tu veux
});
