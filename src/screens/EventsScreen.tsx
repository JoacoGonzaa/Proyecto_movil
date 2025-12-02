// src/screens/EventsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { getEvents } from "../services/api";
import { useApp } from "../contexts/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Events">;

export default function EventsScreen({ navigation }: Props) {
  const { events, setEvents } = useApp();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getEvents();

        // Normalizar eventos: convertir _id → id
        const normalized = data.map((ev: any) => ({
          ...ev,
          id: ev._id,
        }));

        setEvents(normalized);
      } catch (e) {
        console.error("Error fetching events:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = (events || []).filter((ev: any) =>
    ev.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar eventos..."
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12 }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("EventDetail", { id: item.id })}
            style={{
              padding: 12,
              borderWidth: 1,
              marginBottom: 8,
              borderRadius: 8,
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 80, height: 60, borderRadius: 6 }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {item.name}
              </Text>
              <Text style={{ color: "#444" }}>
                {new Date(item.date).toLocaleString()} — {item.location}
              </Text>
              <Text style={{ color: "#666", marginTop: 6 }} numberOfLines={2}>
                {item.category}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
