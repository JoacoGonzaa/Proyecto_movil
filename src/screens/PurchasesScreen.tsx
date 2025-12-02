// src/screens/PurchasesScreen.tsx
import React from "react";
import { View, Text, FlatList } from "react-native";
import { useApp } from "../contexts/AppContext";

export default function PurchasesScreen() {
  const { purchases } = useApp();

  if (!purchases || purchases.length === 0)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No hay compras aún</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
        Historial de compras
      </Text>

      <FlatList
        data={purchases}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>Compra #{item.id}</Text>
            <Text>Total: ${item.total}</Text>
            <Text>Fecha: {new Date(item.createdAt).toLocaleString()}</Text>
            <Text>Items: {item.items.map((it: any) => `${it.ticketName} x${it.quantity}`).join(", ")}</Text>
          </View>
        )}
      />
    </View>
  );
}
