const BASE_URL = "https://tickets.grye.org"; 

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Fetching: ${url}`); // para depurar

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  if (!res.ok) {
    const err = new Error(`API error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body ?? {};
}

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
    return [];
  },
};