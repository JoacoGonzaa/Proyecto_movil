import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  Linking,
  ScrollView,
  Share,
  StatusBar, Text, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api';

const MAX_PER_PERSON = 5;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reserving, setReserving] = useState(false);

  // Estado para el ticket seleccionado
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketOptions, setTicketOptions] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getEvent(id);
        const ev = Array.isArray(data) ? data[0] : data;
        
        console.log("DATOS EVENTO:", JSON.stringify(ev, null, 2));

        if (mounted) {
          setEvent(ev);
          
          // Buscar tickets en ticket_types O tickets
          let options = ev.ticket_types || ev.tickets || [];
          
          // Crear opción por defecto si no hay lista pero hay precio general
          if (options.length === 0 && ev.price) {
             options = [{
                name: "General",
                type: "General",
                price: ev.price,
                available: ev.available_tickets ?? 999
             }];
          }

          setTicketOptions(options);

          // Seleccionar el primero por defecto
          if (options.length > 0) {
             setSelectedTicket(options[0]);
          }
        }

      } catch (e) {
        Alert.alert("Error", "No se pudo cargar la información");
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Cálculos dinámicos
  const currentPrice = Number(selectedTicket?.price) || 0;
  const currentStock = Number(selectedTicket?.available ?? selectedTicket?.quantity ?? 999);
  const isSoldOut = currentStock === 0;

  const increment = () => {
    if (qty < MAX_PER_PERSON) setQty(q => q + 1);
    else Alert.alert("Límite", `Máximo ${MAX_PER_PERSON} tickets.`);
  };

  const decrement = () => {
    if (qty > 1) setQty(q => q - 1);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Evento: ${event.name}` });
    } catch (error) { console.log(error); }
  };

  const openMap = () => {
    const query = encodeURIComponent(event.location || "Santiago");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleReserve = async () => {
    if (qty === 0 || isSoldOut) return;
    setReserving(true);

    try {
      const ticketType = selectedTicket?.name || selectedTicket?.type || "General";
      const items = [{ type: ticketType, quantity: qty }];
      
      const reservation = await api.createReservation({ event_id: id, items });
      const reservationId = reservation.reservation_id || reservation.id || reservation._id;
      
      router.push({
        pathname: "/checkout",
        params: { 
          reservationId: reservationId,
          eventName: event.name,
          eventLocation: event.location || "Ubicación pendiente", 
          ticketType: ticketType, // Pasamos el tipo
          quantity: qty           // Pasamos la cantidad
        } 
      });
    } catch (e: any) {
      Alert.alert("Error", "No se pudo reservar.");
    } finally {
      setReserving(false);
    }
  };

  // === FUNCIÓN SEGURA PARA RENDERIZAR CADA TICKET ===
  // Usamos 'style' para lo dinámico (colores) y 'className' solo para estructura.
  // Esto evita el crash de navegación.
  const renderTicketOption = (ticket: any, index: number) => {
    const isSelected = selectedTicket === ticket;
    const stock = ticket.available ?? ticket.quantity ?? 999;
    const soldOutItem = stock === 0;

    return (
        <TouchableOpacity
            key={index}
            disabled={soldOutItem}
            onPress={() => {
                setSelectedTicket(ticket);
                setQty(1); // Resetear a 1 al cambiar de ticket
            }}
            // Estructura fija (NativeWind)
            className="p-4 mb-3 rounded-xl border flex-row justify-between items-center"
            // Estilos dinámicos (React Native puro) -> ESTO ARREGLA EL ERROR
            style={{
                backgroundColor: isSelected ? '#eff6ff' : (soldOutItem ? '#f3f4f6' : 'white'), // blue-50 / gray-100 / white
                borderColor: isSelected ? '#3b82f6' : '#e5e7eb', // blue-500 / gray-200
                opacity: soldOutItem ? 0.6 : 1
            }}
        >
            <View>
                <Text 
                    className="font-bold text-base"
                    style={{ color: isSelected ? '#1e3a8a' : '#1f2937' }} // blue-900 / gray-800
                >
                    {ticket.name || ticket.type || "General"}
                </Text>
                <Text className="text-xs text-gray-500">
                    {soldOutItem ? "Agotado" : `Disponibles: ${stock}`}
                </Text>
            </View>

            <View className="flex-row items-center">
                {isSelected && (
                    <View style={{ marginRight: 8 }}>
                        <Feather name="check-circle" size={18} color="#0056FF" />
                    </View>
                )}
                <Text 
                    className="font-extrabold text-lg"
                    style={{ color: isSelected ? '#1d4ed8' : '#111827' }} // blue-700 / gray-900
                >
                    ${ticket.price}
                </Text>
            </View>
        </TouchableOpacity>
    );
  };

  if (loading) return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#0056FF"/>
    </View>
  );
  
  if (!event) return null;

  const dateObj = event.date ? new Date(event.date) : new Date();

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#fff' }} />

      <ScrollView 
        className="flex-1 bg-gray-50" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Imagen Header */}
        <View className="relative">
          <Image 
            source={{ uri: event.image || 'https://via.placeholder.com/800x600' }} 
            className="w-full h-80 bg-gray-900" 
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30" />
          <TouchableOpacity 
            onPress={handleShare} 
            className="absolute top-12 right-5 bg-black/40 p-3 rounded-full" 
            style={{ marginTop: insets.top }}
          >
            <Feather name="share" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Información */}
        <View className="-mt-10 bg-white rounded-t-3xl px-6 pt-8 pb-8 shadow-xl">
          
          <View className="flex-row justify-between items-start mb-4">
            <View className="bg-blue-100 px-3 py-1 rounded-md">
                <Text className="text-blue-700 font-bold text-xs uppercase">{event.category || 'EVENTO'}</Text>
            </View>
            <View className={`px-3 py-1 rounded-md border ${!isSoldOut ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
               <Text className={`text-xs font-bold ${!isSoldOut ? 'text-green-700' : 'text-red-700'}`}>
                 {!isSoldOut ? 'DISPONIBLE' : 'AGOTADO'}
               </Text>
            </View>
          </View>

          <Text className="text-3xl font-extrabold text-gray-900 mb-4">{event.name}</Text>

          {/* Grid de Fecha/Hora */}
          <View className="flex-row justify-between mb-8">
             <View className="w-[30%] bg-gray-50 p-3 rounded-xl items-center border border-gray-100">
                <Feather name="calendar" size={24} color="#0056FF" />
                <Text className="text-gray-900 font-semibold text-xs mt-2">{dateObj.toLocaleDateString()}</Text>
             </View>
             <View className="w-[30%] bg-gray-50 p-3 rounded-xl items-center border border-gray-100">
                <Feather name="clock" size={24} color="#0056FF" />
                <Text className="text-gray-900 font-semibold text-xs mt-2">
                    {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
             </View>
             <TouchableOpacity onPress={openMap} className="w-[30%] bg-blue-50 p-3 rounded-xl items-center border border-blue-100">
                <Feather name="map-pin" size={24} color="#0056FF" />
                <Text className="text-blue-900 font-semibold text-xs mt-2">Mapa</Text>
             </TouchableOpacity>
          </View>

          {/* === SELECTOR DE ENTRADAS === */}
          {ticketOptions.length > 0 && (
            <View className="mb-8">
              <Text className="text-lg font-bold text-gray-900 mb-3">Selecciona tu entrada</Text>
              {/* Renderizamos usando la función segura */}
              {ticketOptions.map((ticket, index) => renderTicketOption(ticket, index))}
            </View>
          )}

          <Text className="text-lg font-bold text-gray-900 mb-2">Descripción</Text>
          <Text className="text-gray-600 text-base leading-7 mb-8">{event.description || "No hay descripción disponible."}</Text>
          
          <View className="h-px bg-gray-200" />
          <Text className="text-center text-gray-400 text-xs mt-4">Recomendaciones</Text>
          <Text className="text-gray-500 text-xs text-center mt-2 px-10">
            Por favor, lleva tu identificación oficial el día del evento. Las entradas son intransferibles y no reembolsables.
          </Text>
          <View className="h-4" />
          <Text className="text-center text-gray-400 text-xs">© Tickets Blue</Text>

        </View>
      </ScrollView>

      {/* Footer de Compra */}
      <View 
        className="absolute bottom-0 w-full bg-white border-t border-gray-100 shadow-2xl" 
        style={{ paddingBottom: insets.bottom + 20, paddingTop: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
             <Text className="text-xs text-gray-400 font-bold uppercase">Total</Text>
             <Text className="text-3xl font-extrabold text-ticket-ink">${currentPrice * qty}</Text>
          </View>
          
          <View className="flex-row items-center bg-gray-100 rounded-full px-1 py-1">
            <TouchableOpacity onPress={decrement} disabled={isSoldOut} className="w-10 h-10 items-center justify-center bg-white rounded-full border border-gray-200">
                <Feather name="minus" size={18} color="black" />
            </TouchableOpacity>
            <Text className="w-12 text-center font-bold text-lg">{qty}</Text>
            <TouchableOpacity onPress={increment} disabled={isSoldOut} className="w-10 h-10 items-center justify-center bg-white rounded-full border border-gray-200">
                <Feather name="plus" size={18} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
            onPress={handleReserve} 
            disabled={reserving || isSoldOut} 
            className={`py-4 rounded-xl shadow-lg flex-row justify-center items-center ${isSoldOut ? 'bg-gray-400' : 'bg-ticket-primary'}`}
        >
          {reserving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg uppercase">
                {isSoldOut ? 'AGOTADO' : `COMPRAR (${qty})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}