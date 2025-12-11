import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';

const RESERVE_WINDOW_MS = 10 * 60 * 1000; 

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { reservationId, eventName, eventLocation, ticketType, quantity } = useLocalSearchParams();

  const [reservation, setReservation] = useState<any>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [remainingMs, setRemainingMs] = useState(RESERVE_WINDOW_MS);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      setReservation({
         reservation_id: reservationId,
         status: 'PENDING',
         expires_at: Date.now() + RESERVE_WINDOW_MS
      });
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [reservationId]);

  useEffect(() => {
    if (!reservation) return;
    const interval = setInterval(() => {
      const left = Math.max(0, reservation.expires_at - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reservation]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const handleConfirmPurchase = async () => {
    if (expired) { Alert.alert("Expirado", "El tiempo ha terminado."); return; }
    if (!buyerName.trim() || !buyerEmail.trim()) { Alert.alert("Faltan datos", "Completa nombre y correo."); return; }

    setProcessing(true);
    try {
      const payload = {
        reservation_id: reservationId,
        buyer: { name: buyerName.trim(), email: buyerEmail.trim() },
        payment_method: "card_simulated",
      };

      const response = await api.checkout(payload);
      const purchaseData = response.purchase || response || {};
      
      purchaseData.eventName = eventName;
      purchaseData.location = eventLocation;
      purchaseData.buyer = { 
        name: buyerName.trim(), 
        email: buyerEmail.trim() 
      };

      // == CORRECCIÓN CLAVE ==
      // Forzamos que el recibo guardado tenga la cantidad correcta
      purchaseData.items = [{
          type: ticketType || 'General',
          quantity: Number(quantity) || 1
      }];

      if (!purchaseData.date) purchaseData.date = new Date().toISOString();

      try {
        const existing = await AsyncStorage.getItem('purchases:local');
        const purchases = existing ? JSON.parse(existing) : [];
        purchases.unshift(purchaseData);
        await AsyncStorage.setItem('purchases:local', JSON.stringify(purchases));
      } catch (storageError) { console.error(storageError); }

      Alert.alert("Exito", "Compra realizada correctamente.");
      router.replace("/");
      
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo procesar el pago.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View className="flex-1 bg-white" />;

  return (
    <View 
      className="flex-1 bg-white" 
      style={{ paddingTop: insets.top }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView 
          className="flex-1 px-5 pt-5" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="flex-row items-center mb-8">
            <Text className="text-3xl font-extrabold text-blue-600">Finalizar Compra</Text>
          </View>

          <View className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6">
            <Text className="text-blue-800 font-bold text-lg mb-1">{eventName}</Text>
            <Text className="text-blue-600 text-sm mb-3">
               {ticketType || "Entrada"} x{quantity || 1}
            </Text>
            
            <View className={`self-start px-4 py-2 rounded-full bg-white border ${expired ? 'border-red-200' : 'border-blue-200'}`}>
              <Text className={`font-bold ${expired ? 'text-red-600' : 'text-blue-600'}`}>
                {expired ? "Tiempo Expirado" : `Expira en: ${formatTime(remainingMs)}`}
              </Text>
            </View>
          </View>

          <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Datos del Comprador</Text>
            <View className="mb-4">
              <Text className="text-gray-500 mb-1 ml-1 font-medium">Nombre Completo</Text>
              <TextInput 
                value={buyerName} onChangeText={setBuyerName} placeholder="Ej: Camilo Perez" 
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium"
              />
            </View>
            <View>
              <Text className="text-gray-500 mb-1 ml-1 font-medium">Correo</Text>
              <TextInput 
                value={buyerEmail} onChangeText={setBuyerEmail} placeholder="correo@ejemplo.com" keyboardType="email-address"
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium"
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleConfirmPurchase} disabled={processing || expired}
            className={`py-4 rounded-xl shadow-md mb-10 ${expired ? 'bg-gray-400' : 'bg-blue-600'}`}
          >
            {processing ? <ActivityIndicator color="white" /> : 
              <Text className="text-white font-bold text-lg text-center">Confirmar Pago</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}