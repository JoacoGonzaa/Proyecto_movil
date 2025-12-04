// api/index.js

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

// 2. Función genérica para peticiones HTTP
async function request(endpoint, options = {}) {
  // Construimos la URL completa
  const url = `${BASE_URL}${endpoint}`;
  
  // Log para ver en la consola qué se está consultando 
  console.log(`Fetching: ${url}`);

  // Ejecutamos la petición
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Intentamos procesar la respuesta como JSON
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null; // Si falla el JSON lo dejamos null
  }

  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  // Devolvemos el cuerpo o un objeto vacío si es null
  return body ?? {};
}

// Exportamos los métodos de la API
export const api = {
  // ===== Eventos =====
  getEvents: () => request("/events"),
  
  getEvent: (id) => request(`/events/${id}`),

  // ===== Reservas =====
  createReservation: (data) =>
    request("/reservations", { method: "POST", body: JSON.stringify(data) }),

  // ===== Checkout =====
  checkout: (data) =>
    request("/checkout", { method: "POST", body: JSON.stringify(data) }),

  // ===== Compras / Historial =====
  getPurchases: async () => {
    const candidates = [
      "/purchases",
      "/orders",
      "/sales",
      "/transactions",
    ];

    for (const path of candidates) {
      try {
        return await request(path);
      } catch (e) {
        if (e.status === 404) continue; 
        throw e; 
      }
    }
    // Si ninguno funcionó, devolvemos array vacío
    return [];
  },
};