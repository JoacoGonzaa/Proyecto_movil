// api/index.js

// Obtenemos la URL base desde las variables de entorno
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

async function request(endpoint, options = {}) {
  try {
    // Aseguramos que el endpoint sea un string seguro
    const safeEndpoint = endpoint || "";

    // Limpieza de barras diagonales para evitar duplicados (ej: //api)
    const cleanBase = ENV_URL || "";
    const cleanEndpoint = safeEndpoint.replace(/^\//, "");
    
    const url = `${cleanBase}/${cleanEndpoint}`;
    
    // Log para depuración en consola
    console.log(`[API] Solicitando: ${url}`); 

    // Configuración predeterminada de headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Ejecución de la petición fetch
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Intento de parseo de respuesta JSON
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      // Si la respuesta no tiene cuerpo JSON (ej: un 204 No Content), body queda null
      body = null;
    }

    // Manejo de errores HTTP (status fuera del rango 200-299)
    if (!res.ok) {
      console.error(`API Error ${res.status} en ${url}`);
      const err = new Error(`API error ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    // Retornamos un objeto vacío si body es null para evitar errores en el frontend
    return body ?? {};

  } catch (error) {
    console.error("ERROR CRITICO EN REQUEST:", error);
    throw error;
  }
}

// Objeto principal con los métodos de la API
export const api = {
  // Obtener lista de eventos con paginación
  getEvents: (page = 1) => request(`/events?page=${page}`),
  
  // Obtener detalle de un evento específico
  getEvent: (id) => {
    if (!id) throw new Error("ID requerido");
    return request(`/events/${id}`);
  },

  // Crear una reserva (POST)
  createReservation: (data) =>
    request("/reservations", { method: "POST", body: JSON.stringify(data) }),

  // Cancelar una reserva (DELETE) 
  cancelReservation: (id) => {
    if (!id) throw new Error("ID de reserva requerido para cancelar");
    return request(`/reservations/${id}`, { method: "DELETE" });
  },

  // Procesar el pago y finalizar compra (POST)
  checkout: (data) =>
    request("/checkout", { method: "POST", body: JSON.stringify(data) }),
};