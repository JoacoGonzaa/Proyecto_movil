import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PurchasesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- Carga inicial de datos ---
  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const localData = await AsyncStorage.getItem('purchases:local');
      setPurchases(localData ? JSON.parse(localData) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica para borrar historial ---
  const handleClearHistory = async () => {
    Alert.alert(
      "Borrar Historial",
      "Seguro que quieres borrar todo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('purchases:local');
              setPurchases([]);
            } catch (e) { console.error(e); }
          }
        }
      ]
    );
  };

  // --- Lógica de UI (Expandir y Mapas) ---
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenMap = (locationName: string) => {
    const query = encodeURIComponent(locationName);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(err => console.error("Error abriendo mapa", err));
  };

  // --- Renderizado de cada Tarjeta de Compra ---
  const renderPurchase = ({ item }: { item: any }) => {
    const id = item.purchase_id || item.id || item._id || item.reservation_id || '---';
    const uniqueId = String(id);
    const isExpanded = expandedId === uniqueId;

    const total = item.total_price ?? item.total ?? 0;
    const items = item.items || [];
    const totalTickets = items.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 1), 0);

    const clientName = item.buyer?.name || 'Cliente';
    const clientMail = item.buyer?.email || 'Sin correo';
    const eventName = item.eventName || "Evento";
    const location = item.location || "Ubicación desconocida";

    return (
      <View className="bg-white mb-4 rounded-xl border border-gray-200 shadow-sm mx-4 overflow-hidden">
        
        {/* Cabecera Resumen de la Tarjeta */}
        <TouchableOpacity
          onPress={() => toggleExpand(uniqueId)}
          className={`p-4 flex-row justify-between items-center ${isExpanded ? 'bg-blue-50 border-b border-blue-100' : 'bg-white'}`}
          activeOpacity={0.7}
        >
          <View className="flex-1 pr-2">
            <Text className="font-bold text-gray-900 text-base">{eventName}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {item.date ? new Date(item.date).toLocaleDateString() : ''}
            </Text>
          </View>

          <View className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 flex-row items-center">
            <Feather name="tag" size={12} color="#4b5563" style={{ marginRight: 4 }} />
            <Text className="text-gray-700 font-bold text-xs">{totalTickets} tkt</Text>
          </View>
        </TouchableOpacity>

        {/* Detalle Desplegable */}
        {isExpanded && (
          <View className="p-4 bg-white">
            
            {/* Lista de Tickets */}
            <View className="mb-4 border-b border-gray-100 pb-4">
              <Text className="text-xs text-gray-400 font-bold uppercase mb-3 flex-row items-center">
                <Feather name="list" size={12} />  Detalle de Entradas
              </Text>

              {items.length > 0 ? (
                items.map((it: any, i: number) => (
                  <View key={i} className="flex-row justify-between items-center mb-2 last:mb-0 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <Text className="text-gray-800 font-medium text-sm flex-1 mr-2">
                      {it.type || "Entrada General"}
                    </Text>
                    <Text className="text-blue-600 font-bold text-sm">x{it.quantity || 1}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 italic text-sm">Sin detalle</Text>
              )}
            </View>

            {/* Grid 2 Columnas (Datos y Lugar) */}
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100">
                <View className="flex-row items-center mb-2">
                  <Feather name="user" size={14} color="#0056FF" />
                  <Text className="text-xs text-gray-400 uppercase font-bold ml-2">Datos</Text>
                </View>
                <Text className="text-gray-900 font-bold text-sm mb-0.5" numberOfLines={1}>{clientName.split(' ')[0]}</Text>
                <Text className="text-gray-500 text-xs" numberOfLines={1}>{clientMail}</Text>
              </View>

              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100">
                <View className="flex-row items-center mb-2">
                  <Feather name="map-pin" size={14} color="#0056FF" />
                  <Text className="text-xs text-gray-400 uppercase font-bold ml-2">Lugar</Text>
                </View>
                <Text className="text-gray-900 text-xs font-medium mb-2" numberOfLines={2}>{location}</Text>
                <TouchableOpacity onPress={() => handleOpenMap(location)}>
                  <Text className="text-blue-600 text-xs font-bold underline">Ver mapa</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer del detalle (ID y Precio) */}
            <View className="flex-row justify-between items-center pt-2">
              <View className="flex-row items-center">
                <Feather name="hash" size={14} color="#9ca3af" />
                <Text className="text-xs font-mono text-gray-500 ml-1">{uniqueId.slice(-8)}</Text>
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-xs text-gray-400 mr-1">Total: </Text>
                <Text className="text-2xl font-extrabold text-blue-600">${total}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View className="flex-1 bg-white" />;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* --- INICIO DE CABECERA MODIFICADA --- */}
      <View className="flex-row items-center justify-between px-5 mb-4 pt-2">
        
        {/* 1. Izquierda: Botón Borrar*/}
        <View className="flex-1 items-start">
          {purchases.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearHistory}
              className="bg-red-50 p-2.5 rounded-full border border-red-100"
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>

        {/* Centro: Título Centrado */}
        <View className="flex-[2] items-center">
          <Text className="text-xl font-extrabold text-gray-900 text-center">
            Mis Compras
          </Text>
        </View>

        {/* Derecha: Botón Volver*/}
        <View className="flex-1 items-end">
          <TouchableOpacity
            onPress={() => router.back()}
            // Mismo estilo visual que el de borrar, pero en gris/neutro
            className="bg-gray-100 p-2.5 rounded-full border border-gray-200"
          >
            {/* Usamos arrow-right o corner-up-left. Arrow-right da sensación de 'salir' */}
            <Feather name="arrow-right" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item, index) => String(index)}
        renderItem={renderPurchase}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 opacity-50">
            <Feather name="shopping-bag" size={64} color="#9ca3af" />
            <Text className="text-center mt-4 text-gray-500 font-medium">No tienes compras guardadas</Text>
          </View>
        }
      />
    </View>
  );
}