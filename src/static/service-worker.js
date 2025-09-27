self.addEventListener('install', event => {
  console.log('Pro Axess installed as PWA app');
});

self.addEventListener('fetch', event => {
  // Ici tu pourrais mettre du caching si tu veux
});
