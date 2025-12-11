// api/index.js

// 1. Configuración de la URL Base
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function request(endpoint, options = {}) {
  // A. Construcción de la URL Completa
  // Quita el slash final de la base URL si existe
  const cleanBase = BASE_URL.replace(/\/$/, "");
  // Quita el slash inicial del endpoint si existe
  const cleanEndpoint = endpoint.replace(/^\//, "");
  
  // Une las partes con un solo slash
  const url = `${cleanBase}/${cleanEndpoint}`;
  
  console.log(`📡 Fetching: ${url}`); // Log para depurar

  // B. Configuración de Headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers, // Permite agregar headers extra si fuera necesario
  };

  // C. Ejecutar Petición
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // D. Procesar Respuesta
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // Si la respuesta no es JSON (ej: error 500 del servidor o texto plano), body queda null
    body = null;
  }

  // E. Manejo de Errores HTTP (404, 500, etc)
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body ?? {};
}

// 2. Exportamos los métodos de la API
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

  // ===== Compras (Opcional si la API lo soporta en el futuro) =====
  getPurchases: async () => {
    // Intentamos varios endpoints comunes por si la API cambia
    const candidates = [
      "/purchases",
      "/orders",
      "/sales",
    ];

    for (const path of candidates) {
      try {
        return await request(path);
      } catch (e) {
        // Si da 404, probamos el siguiente. Si es otro error, fallamos.
        if (e.status === 404) continue; 
        throw e; 
      }
    }
    return [];
  },
};