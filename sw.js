// sw.js

self.addEventListener('push', event => {
  const data = event.data.json();
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/vite.svg', // A default icon
    badge: '/vite.svg', // An icon for the notification tray
    data: {
      url: data.url || '/' // URL to open on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.navigate(urlToOpen);
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
