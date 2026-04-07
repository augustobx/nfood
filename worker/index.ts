/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// 1. Escuchar cuando llega una notificación Push desde el servidor
self.addEventListener('push', (event) => {
    let data: any = {};

    try {
        data = event.data?.json() ?? {};
    } catch (e) {
        console.error("Error al procesar la notificación PUSH", e);
    }

    const title = data.title || "Notificación de Raptor Burger";
    const options = {
        body: data.body || "Tienes una nueva actualización en tu pedido.",
        icon: "/logo.png", // Ícono principal de la app
        badge: "/logo.png",      // Ícono pequeño monocromático (ej. barra de estado en Android)
        vibrate: [200, 100, 200, 100, 200], // Patrón de vibración en móviles
        data: {
            url: data.url || "/", // La URL a la que ir al hacer click (viene desde admin-orders.ts)
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Escuchar cuando el usuario hace CLICK en la notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Cierra el recuadro de la notificación

    // Resuelve la URL relativa a una URL absoluta
    const urlToOpen = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si el usuario ya tiene la pestaña del pedido abierta, la enfocamos
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no la tiene abierta, le abrimos una nueva ventana/pestaña en esa ruta
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});