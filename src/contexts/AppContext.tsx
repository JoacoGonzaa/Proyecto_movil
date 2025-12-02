// src/contexts/AppContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventItem } from "../services/api";

type Reservation = {
  id: string;
  eventId: string;
  ticketIndex: number;
  quantity: number;
  ticketName: string;
  unitPrice: number;
  createdAt: string;
};

type Purchase = {
  id: string;
  reservationId: string;
  eventId: string;
  items: { ticketName: string; quantity: number; unitPrice: number }[];
  total: number;
  createdAt: string;
};

type AppContextType = {
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  getEventById: (id: string) => EventItem | undefined;
  createLocalReservation: (payload: {
    eventId: string;
    ticketIndex: number;
    quantity: number;
  }) => Reservation;
  getReservationById: (id: string) => Reservation | undefined;
  addPurchaseFromReservation: (reservationId: string) => Promise<Purchase>;
  purchases: Purchase[];
};

const AppContext = createContext<AppContextType | null>(null);

const PURCHASES_KEY = "PURCHASES_V1";

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PURCHASES_KEY);
        if (raw) setPurchases(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed load purchases", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
      } catch (e) {
        console.warn("Failed save purchases", e);
      }
    })();
  }, [purchases]);

  const getEventById = (id: string) => events.find((e) => e._id === id);

  const createLocalReservation = (payload: {
    eventId: string;
    ticketIndex: number;
    quantity: number;
  }): Reservation => {
    const { eventId, ticketIndex, quantity } = payload;
    const ev = getEventById(eventId);
    const ticket = ev?.tickets?.[ticketIndex];
    const reservation: Reservation = {
      id: String(Date.now()),
      eventId,
      ticketIndex,
      quantity,
      ticketName: ticket?.name ?? "Ticket",
      unitPrice: ticket?.price ?? 0,
      createdAt: new Date().toISOString(),
    };
    setReservations((p) => [...p, reservation]);
    return reservation;
  };

  const getReservationById = (id: string) =>
    reservations.find((r) => r.id === id);

  const addPurchaseFromReservation = async (reservationId: string) => {
    const r = getReservationById(reservationId);
    if (!r) throw new Error("Reservation not found");

    const total = r.quantity * r.unitPrice;
    const purchase: Purchase = {
      id: String(Date.now()),
      reservationId: r.id,
      eventId: r.eventId,
      items: [
        {
          ticketName: r.ticketName,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
        },
      ],
      total,
      createdAt: new Date().toISOString(),
    };

    setPurchases((p) => [purchase, ...p]);
    return purchase;
  };

  return (
    <AppContext.Provider
      value={{
        events,
        setEvents,
        getEventById,
        createLocalReservation,
        getReservationById,
        addPurchaseFromReservation,
        purchases,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
