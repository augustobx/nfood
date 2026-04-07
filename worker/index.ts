/// <reference lib="webworker" />
export { }; // <-- Esto convierte el archivo en un módulo y soluciona el error

declare const self: ServiceWorkerGlobalScope;

// 1. Escuchar cuando llega una notificación Push desde el servidor
self.addEventListener('push', (event) => {
    let data: any = {};

    try {
        data = event.data?.json() ?? {};
    } catch (e) {
        console.error("Error al procesar la notificación PUSH", e);
    }

    const title = data.title || "Notificación de NFood";
    const options = {
        body: data.body || "Tienes una nueva actualización en tu pedido.",
        icon: "/apple-icon.png",
        badge: "/logo.png",
        vibrate: [200, 100, 200, 100, 200],
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Escuchar cuando el usuario hace CLICK en la notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});