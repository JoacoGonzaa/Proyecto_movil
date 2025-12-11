import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados para los datos
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Estados de carga y paginación
  const [loadingInitial, setLoadingInitial] = useState(true); // Carga primera vez
  const [loadingMore, setLoadingMore] = useState(false);    // Cargando más abajo
  const [refreshing, setRefreshing] = useState(false);      // Pull to refresh
  const [page, setPage] = useState(1);                      // Página actual
  const [hasMore, setHasMore] = useState(true);             // ¿Quedan eventos?

  // Función maestra para cargar eventos
  const fetchEvents = async (pageToLoad: number, shouldRefresh = false) => {
    try {
      // Si estamos refrescando o es la pag 1, permitimos cargar aunque hasMore sea false
      if (!hasMore && !shouldRefresh && pageToLoad > 1) return;

      const data = await api.getEvents(pageToLoad);
      const newEvents = Array.isArray(data) ? data : (data.data || []);
      
      // Si vienen menos de 1 eventos asumimos que se acabaron
      if (newEvents.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (shouldRefresh || pageToLoad === 1) {
        // Si es refresh, reemplazamos todo
        setEvents(newEvents);
      } else {
        // Si es paginación, agregamos al final (evitando duplicados por ID si la API es inestable)
        setEvents(prevEvents => {
            // Unimos arrays
            const combined = [...prevEvents, ...newEvents];
            // Filtramos duplicados por ID por seguridad
            const unique = combined.filter((v, i, a) => a.findIndex(t => (t.id || t._id) === (v.id || v._id)) === i);
            return unique;
        });
      }
    } catch (e) { 
      console.error("Error cargando eventos:", e); 
    } finally { 
      setLoadingInitial(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchEvents(1);
  }, []);

  // Función al deslizar hacia abajo para recargar
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchEvents(1, true);
  };

  // Función al llegar al final de la lista
  const handleLoadMore = () => {
    if (!loadingMore && !loadingInitial && hasMore && search === "") {
      // Solo cargamos mas si NO estamos buscando (el buscador filtra localmente)
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchEvents(nextPage);
    }
  };

  // Filtrado local (Buscador)
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
                   {item.date ? new Date(item.date).toLocaleDateString() : 'Próximamente'}
                </Text>
             </View>
           </View>
        </TouchableOpacity>
     );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-10" />; // Espacio vacío
    return (
        <View className="py-5 items-center">
            <ActivityIndicator size="small" color="#0056FF" />
            <Text className="text-gray-400 text-xs mt-2">Cargando más eventos...</Text>
        </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-white border-b border-gray-100"> 
        <Text className="text-2xl font-extrabold text-blue-600 tracking-tight">Tickets Blue</Text>
        <TouchableOpacity onPress={() => router.push('/purchases' as any)} className="bg-blue-600 px-4 py-2 rounded-full shadow-sm flex-row items-center">
            <Feather name="shopping-bag" size={16} color="white" style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-xs uppercase">Mis compras</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View className="px-5 py-4">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200">
           <Feather name="search" size={20} color="gray" />
           <TextInput 
             placeholder="Buscar eventos..." 
             placeholderTextColor="#9ca3af" 
             className="flex-1 ml-3 text-base text-gray-800"
             value={search}
             onChangeText={setSearch}
           />
        </View>
      </View>

      {/* Lista de Eventos */}
      {loadingInitial ? (
        <ActivityIndicator size="large" color="#0056FF" className="mt-10" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id || item._id || item.event_id)}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          
          // Pull to Refresh
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0056FF']} />
          }
          
          // Infinite Scroll (Paginación)
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // Carga cuando falte la mitad de la pantalla para llegar al final
          ListFooterComponent={renderFooter}
          
          ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No se encontraron eventos</Text>}
        />
      )}
    </View>
  );
}