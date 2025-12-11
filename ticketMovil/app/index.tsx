import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Estado para el pull-to-refresh
  const [search, setSearch] = useState("");

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      // Aseguramos que data sea un array, a veces viene como { data: [...] }
      const list = Array.isArray(data) ? data : (data.data || []);
      
      // Ordenamos para que los nuevos salgan primero (si tienen fecha de creacion)
      // O invertimos el array si la API manda los viejos primero
      setEvents(list.reverse()); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const filteredEvents = events.filter(ev => 
    ev.name && ev.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePressEvent = (eventId: string) => {
    router.push(`/event/${eventId}` as any);
  };

  const renderEvent = ({ item }: { item: any }) => {
     const realId = item.id || item._id || item.event_id;
     return (
        <TouchableOpacity 
          onPress={() => handlePressEvent(realId)}
          className="bg-white mb-5 rounded-2xl shadow-sm border border-gray-100 mx-5 overflow-hidden"
          activeOpacity={0.9}
        >
           <Image 
             source={{ uri: item.image || 'https://via.placeholder.com/800x400' }} 
             className="w-full h-40 bg-gray-200"
             resizeMode="cover"
           />
           <View className="p-4">
             <Text className="text-xs font-bold text-blue-600 uppercase mb-1">{item.category || 'EVENTO'}</Text>
             <Text className="text-lg font-extrabold text-gray-900 mb-1">{item.name}</Text>
             <View className="flex-row items-center mt-2">
                <Feather name="calendar" size={14} color="gray" />
                <Text className="text-gray-500 text-xs ml-2">
                   {item.date ? new Date(item.date).toLocaleDateString() : 'Proximamente'}
                </Text>
             </View>
           </View>
        </TouchableOpacity>
     );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      <View className="px-5 py-4 flex-row justify-between items-center bg-white border-b border-gray-100"> 
        <Text className="text-2xl font-extrabold text-blue-600 tracking-tight">Tickets Blue</Text>
        <TouchableOpacity onPress={() => router.push('/purchases' as any)} className="bg-blue-600 px-4 py-2 rounded-full shadow-sm flex-row items-center">
            <Feather name="shopping-bag" size={16} color="white" style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-xs uppercase">Mis compras</Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 py-3">
        <View className="bg-white flex-row items-center px-3 py-2 rounded-xl border border-gray-200">
           <Feather name="search" size={20} color="gray" />
           <TextInput placeholder="Buscar eventos..." className="flex-1 ml-3 text-base text-gray-800" value={search} onChangeText={setSearch} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0056FF" className="mt-10" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id || item._id || item.event_id)}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          // AQUI ESTA LA MAGIA PARA ACTUALIZAR:
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0056FF']} />
          }
          ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No se encontraron eventos</Text>}
        />
      )}
    </View>
  );
}