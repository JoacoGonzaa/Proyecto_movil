// src/screens/EventDetail.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useApp } from "../contexts/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "EventDetail">;

export default function EventDetail({ route, navigation }: Props) {
  const { id } = route.params;
  const { getEventById } = useApp();

  const event = getEventById(id);

  if (!event)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No se encontró el evento</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {event.image ? (
        <Image
          source={{ uri: event.image }}
          style={{ width: "100%", height: 200, borderRadius: 8, marginBottom: 12 }}
          resizeMode="cover"
        />
      ) : null}

      {/* Info del evento */}
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        {event.name}
      </Text>

      <Text style={{ marginBottom: 6 }}>
        📅 {event.date ? new Date(event.date).toLocaleString() : "Fecha no especificada"}
      </Text>

      <Text style={{ marginBottom: 6 }}>📍 {event.location ?? "Ubicación no indicada"}</Text>
      <Text style={{ marginBottom: 10, color: "#666" }}>
        {event.category ?? "Sin categoría"}
      </Text>

      {/* Tickets */}
      <Text style={{ fontWeight: "600", marginBottom: 8 }}>Tipos de ticket</Text>

      {(!event.tickets || event.tickets.length === 0) && (
        <Text style={{ color: "#888" }}>Este evento no tiene tickets registrados</Text>
      )}

      <FlatList
        data={event.tickets || []}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Reservation", {
                eventId: event._id,
                ticketIndex: index,
                ticketName: item.name,
                unitPrice: item.price,
              })
            }
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.name}</Text>
            <Text style={{ marginTop: 4 }}>Precio: ${item.price}</Text>
            <Text style={{ marginTop: 4 }}>
              Disponibles: {item.available ?? "—"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
