import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../api'; // Ajusta la ruta si es necesario (../../api o ../api)

const MAX_PER_PERSON = 5;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams(); // Obtenemos el ID de la URL
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1); // Cantidad de tickets (General)
  const [reserving, setReserving] = useState(false);

  // Cargar evento
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getEvent(id);
        const ev = Array.isArray(data) ? data[0] : data;
        if (mounted) setEvent(ev);
      } catch (e) {
        Alert.alert("Error", "No se pudo cargar la información del evento");
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Lógica del contador
  const increment = () => {
    if (qty < MAX_PER_PERSON) setQty(q => q + 1);
    else Alert.alert("Límite alcanzado", `Máximo ${MAX_PER_PERSON} entradas por persona.`);
  };

  const decrement = () => {
    if (qty > 1) setQty(q => q - 1);
  };

  // Crear reserva y navegar al Checkout
  const handleReserve = async () => {
    if (qty === 0) return;
    setReserving(true);

    try {
      // 1. Preparamos los items igual que en tu web
      const items = [{ type: "General", quantity: qty }];
      
      // 2. Llamamos a tu API
      const reservation = await api.createReservation({ event_id: id, items });
      
      // 3. Obtenemos los datos clave
      const reservationId = reservation.reservation_id || reservation.id || reservation._id;
      
      console.log("Reserva creada:", reservationId);

      // 4. Navegamos al Checkout pasando el ID de la reserva como parámetro
      router.push(`/checkout?reservationId=${reservationId}`);

    } catch (e: any) {
      Alert.alert("Error", "No se pudo crear la reserva. Intenta nuevamente.");
      console.error(e);
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-ticket-bg">
        <ActivityIndicator size="large" color="#0056FF" />
      </View>
    );
  }

  if (!event) return null;

  return (
    <SafeAreaView className="flex-1 bg-ticket-bg">
      <StatusBar barStyle="dark-content" />
      {/* Esto configura el título de la navegación automáticamente */}
      <Stack.Screen options={{ title: 'Detalle del Evento', headerBackTitle: 'Volver', headerTintColor: '#0056FF' }} />

      <ScrollView className="flex-1">
        {/* Imagen Principal (Hero) */}
        <Image 
          source={{ uri: event.image || 'https://via.placeholder.com/800x600' }} 
          className="w-full h-64 bg-gray-300"
          resizeMode="cover"
        />

        {/* Contenedor de Información */}
        <View className="p-5 -mt-6 bg-ticket-bg rounded-t-3xl shadow-sm">
          {/* Título y Categoría */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-4">
               <Text className="text-2xl font-extrabold text-ticket-ink mb-1">{event.name}</Text>
               <Text className="text-ticket-primary font-bold">{event.category || 'Concierto'}</Text>
            </View>
            <View className="bg-white px-3 py-1 rounded-lg border border-ticket-line">
              <Text className="text-xs font-bold text-ticket-muted">
                 {new Date(event.date).getDate()}
              </Text>
              <Text className="text-xs text-center text-ticket-muted uppercase">
                 {new Date(event.date).toLocaleString('default', { month: 'short' })}
              </Text>
            </View>
          </View>

          {/* Detalles (Ubicación y Fecha) */}
          <View className="mt-4 space-y-2">
            <Text className="text-ticket-muted text-base">
              📍 {event.location || 'Ubicación por confirmar'}
            </Text>
            <Text className="text-ticket-muted text-base">
              📅 {event.date ? new Date(event.date).toLocaleString() : 'Fecha por confirmar'}
            </Text>
          </View>

          {/* Descripción */}
          <Text className="mt-6 text-ticket-ink text-base leading-6">
            {event.description || "No hay descripción disponible para este evento. ¡No te lo pierdas!"}
          </Text>

        </View>
      </ScrollView>

      {/* Barra Inferior Flotante (Selección y Compra) */}
      <View className="bg-white p-5 border-t border-ticket-line shadow-lg pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-ticket-ink">Entrada General</Text>
          
          {/* Selector de Cantidad (+ -) */}
          <View className="flex-row items-center bg-gray-100 rounded-xl p-1">
            <TouchableOpacity 
              onPress={decrement}
              className={`w-10 h-10 items-center justify-center bg-white rounded-lg shadow-sm ${qty === 1 ? 'opacity-50' : ''}`}
              disabled={qty === 1}
            >
              <Text className="text-xl font-bold text-ticket-ink">-</Text>
            </TouchableOpacity>
            
            <Text className="w-12 text-center text-xl font-bold text-ticket-ink">{qty}</Text>
            
            <TouchableOpacity 
              onPress={increment}
              className={`w-10 h-10 items-center justify-center bg-white rounded-lg shadow-sm ${qty >= MAX_PER_PERSON ? 'opacity-50' : ''}`}
              disabled={qty >= MAX_PER_PERSON}
            >
              <Text className="text-xl font-bold text-ticket-ink">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de Reservar */}
        <TouchableOpacity 
          onPress={handleReserve}
          disabled={reserving}
          className={`bg-ticket-primary py-4 rounded-xl shadow-md flex-row justify-center items-center ${reserving ? 'opacity-70' : ''}`}
        >
          {reserving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg text-center">
              Reservar {qty} {qty === 1 ? 'ticket' : 'tickets'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}