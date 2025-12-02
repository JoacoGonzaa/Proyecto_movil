// src/services/api.ts
import axios from "axios";

export const API_BASE = "https://tickets.grye.org";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export type TicketType = {
  name: string;
  price: number;
  available?: number;
};

export type EventItem = {
  _id: string;
  name: string;
  date: string;
  category?: string;
  location?: string;
  image?: string;
  tickets?: TicketType[];
};

export async function getEvents(): Promise<EventItem[]> {
  const res = await api.get("/events");
  // API devuelve un array directamente
  return Array.isArray(res.data) ? res.data : [];
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const res = await api.get(`/events/${id}`);
  return res.data ?? null;
}
