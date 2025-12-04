import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PurchasesScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar compras locales
  useEffect(() => {
    (async () => {
      try {
        const localData = await AsyncStorage.getItem('purchases:local');
        setPurchases(localData ? JSON.parse(localData) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderPurchase = ({ item }: { item: any }) => {
    const id = item.purchase_id || item.id || '---';
    const total = item.total_price ?? item.total ?? 0;
    const items = item.items || [];

    return (
      <View className="bg-white p-4 mb-4 rounded-xl border border-ticket-line shadow-sm mx-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-bold text-ticket-ink">Compra #{String(id).slice(-6)}</Text>
          <Text className="text-xs text-ticket-muted">{item.date ? new Date(item.date).toLocaleDateString() : ''}</Text>
        </View>
        <View className="flex-row justify-between items-center mb-3">
           <View className="bg-green-100 px-2 py-1 rounded"><Text className="text-green-700 text-xs font-bold uppercase">CONFIRMADO</Text></View>
           <Text className="text-lg font-extrabold text-ticket-primary">${total}</Text>
        </View>
        <View className="border-t border-gray-100 pt-2">
          {items.map((it: any, i: number) => (
            <Text key={i} className="text-ticket-muted text-sm">• {it.quantity}x {it.type || 'General'}</Text>
          ))}
        </View>
      </View>
    );
  };

  if (loading) return <View className="flex-1 bg-ticket-bg" />;
// Margen superior seguro
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0;

  return (
    <SafeAreaView className="flex-1 bg-ticket-bg" style={{ paddingTop: topPadding }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Cabecera Manual */}
      <View className="flex-row items-center px-5 mb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-white px-3 py-2 rounded-xl border border-gray-200">
          <Text className="text-ticket-primary font-bold">← Volver</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-ticket-primary">Mis Compras</Text>
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item, index) => String(index)}
        renderItem={renderPurchase}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-10">
            <Text className="text-5xl mb-4"></Text>
            <Text className="text-xl font-bold text-ticket-ink text-center">Historial vacío</Text>
            <Text className="text-ticket-muted text-center mb-6 mt-2">Realiza una compra para verla aquí.</Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-ticket-primary px-6 py-3 rounded-xl">
               <Text className="text-white font-bold">Ir a Eventos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}