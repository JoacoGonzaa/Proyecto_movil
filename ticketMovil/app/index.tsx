// app/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../api';
import EventCard from '../components/EventCard';

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getEvents();
        const arr = Array.isArray(res) ? res : (res?.data || res?.results || []);
        if (mounted) setEvents(arr);
      } catch (e: any) {
        setError(e?.message || "Error de conexión");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter((ev: any) => {
      const text = `${ev?.name ?? ""} ${ev?.category ?? ""} ${ev?.location ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [search, events]);

  const handlePressEvent = (eventId: string) => {
    console.log("Navegando al evento:", eventId);
    router.push(`/event/${eventId}`);
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="#f2f5fa" />
      
      {/* Header */}
      <View className={`px-5 py-4 bg-ticket-card shadow-sm flex-row justify-between items-center z-10 ${Platform.OS === 'android' ? 'mt-8 elevation-4' : ''}`}> 
        <View>
            {/*Logo de texto con el color primario */}
            <Text className="text-2xl font-extrabold text-ticket-primary tracking-tight">Tickets Blue</Text>
        </View>
        {/* Botón Mis Compras*/}
        <TouchableOpacity className="bg-ticket-primary px-5 py-2.5 rounded-xl shadow-sm">
            <Text className="text-white font-bold text-sm">Mis compras</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-5 pt-6">
        {/*Título y Buscador*/}
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-ticket-primary mb-4">Eventos</Text>
          
          <View className="bg-ticket-card border border-ticket-line rounded-xl shadow-sm overflow-hidden">
            <TextInput
              placeholder="Buscar eventos..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              className="p-4 text-ticket-ink text-base font-medium"
              selectionColor="#0056FF" 
            />
          </View>
        </View>

        {/* Estados de Carga y Error */}
        {loading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0056FF" />
            <Text className="text-ticket-muted mt-4 font-medium">Cargando los mejores eventos...</Text>
          </View>
        )}

        {!loading && error && (
           <View className="p-4 bg-red-50 border border-red-200 rounded-xl">
             <Text className="text-red-700 font-medium">⚠ {error}</Text>
           </View>
        )}

        {/* Lista de Eventos */}
        {!loading && !error && (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item: any) => item.id || item._id || item.event_id}
            renderItem={({ item }) => {
              const realId = item.id || item._id || item.event_id;
              return (
              <EventCard 
                title={item.name} 
                date={item.date ? new Date(item.date).toLocaleDateString() : 'Fecha por confirmar'} 
                imageUrl={item.image}
                onPress={() => handlePressEvent(realId)}
              />
              );
            }}
            ListEmptyComponent={
              <View className="items-center mt-10 opacity-60">
                 <Text className="text-xl font-bold text-ticket-muted">No se encontraron eventos</Text>
                 <Text className="text-ticket-muted mt-2">Intenta con otra búsqueda</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            // Padding inferior para que el último elemento no quede pegado al borde
            contentContainerStyle={{ paddingBottom: 30 }} 
          />
        )}
      </View>
    </SafeAreaView>
  );
}