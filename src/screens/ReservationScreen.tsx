// src/screens/ReservationScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useApp } from "../contexts/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Reservation">;

export default function ReservationScreen({ route, navigation }: Props) {
  const { eventId, ticketIndex, ticketName, unitPrice } = route.params;
  const { createLocalReservation } = useApp();

  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);

  const numericQty = Math.max(1, Number(qty) || 1);

  async function handleReserve() {
    try {
      setLoading(true);
      const reservation = createLocalReservation({
        eventId: eventId!,
        ticketIndex: ticketIndex ?? 0,
        quantity: numericQty,
      });
      // navegamos al checkout con reservationId
      navigation.replace("Checkout", { reservationId: reservation.id });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear la reserva");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        Reservar: {ticketName}
      </Text>

      <Text>Precio unitario: ${unitPrice ?? "—"}</Text>

      <Text style={{ marginTop: 12 }}>Cantidad</Text>
      <TextInput
        value={qty}
        onChangeText={setQty}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginVertical: 10 }}
      />

      <TouchableOpacity
        onPress={handleReserve}
        style={{
          backgroundColor: "#1f8ef1",
          padding: 12,
          borderRadius: 8,
          marginTop: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
            Crear reserva
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
