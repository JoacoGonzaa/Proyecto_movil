// src/screens/CheckoutScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useApp } from "../contexts/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

export default function CheckoutScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const { getReservationById, addPurchaseFromReservation, getEventById } = useApp();
  const [loading, setLoading] = useState(false);

  const reservation = getReservationById(reservationId);

  useEffect(() => {
    if (!reservation) {
      Alert.alert("Reserva no encontrada");
      navigation.goBack();
    }
  }, [reservation]);

  if (!reservation) return null;

  const event = getEventById(reservation.eventId);
  const total = reservation.quantity * reservation.unitPrice;

  async function handleConfirm() {
    try {
      setLoading(true);
      await addPurchaseFromReservation(reservation!.id);
      Alert.alert("Compra confirmada (simulada)");
      navigation.navigate("Purchases");
    } catch (e) {
      console.error(e);
      Alert.alert("Error al procesar compra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Checkout</Text>

      <Text style={{ marginTop: 12 }}>Evento: {event?.name ?? "—"}</Text>
      <Text>Cantidad: {reservation.quantity}</Text>
      <Text>Producto: {reservation.ticketName}</Text>
      <Text style={{ fontWeight: "700", marginTop: 12 }}>Total: ${total}</Text>

      <TouchableOpacity
        onPress={handleConfirm}
        style={{
          marginTop: 20,
          backgroundColor: "green",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
            Confirmar compra (simulada)
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
