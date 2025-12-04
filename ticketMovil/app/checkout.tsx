import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, 
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const RESERVE_WINDOW_MS = 10 * 60 * 1000; 

export default function CheckoutScreen() {
  const router = useRouter();
  const { reservationId } = useLocalSearchParams();

  // Estados
  const [reservation, setReservation] = useState<any>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [remainingMs, setRemainingMs] = useState(RESERVE_WINDOW_MS);
  const [expired, setExpired] = useState(false);

  // Cargar datos
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

  // Temporizador
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

  // Confirmar Compra
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
      
      if (!purchaseData.date) purchaseData.date = new Date().toISOString();
      if (!purchaseData.items) purchaseData.items = reservation?.items || [{type:'General', quantity:1}];

      try {
        const existing = await AsyncStorage.getItem('purchases:local');
        const purchases = existing ? JSON.parse(existing) : [];
        purchases.unshift(purchaseData);
        await AsyncStorage.setItem('purchases:local', JSON.stringify(purchases));
      } catch (storageError) { console.error(storageError); }

      Alert.alert("¡Éxito!", "Compra realizada correctamente.");
      router.replace("/");
      
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo procesar el pago.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View className="flex-1 bg-ticket-bg" />;

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0;

  return (
    <SafeAreaView className="flex-1 bg-ticket-bg" style={{ paddingTop: topPadding }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
          
          {/* Cabecera con Botón Volver */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 bg-white p-2 rounded-full border border-gray-200">
              <Text className="text-ticket-primary font-bold">←</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-extrabold text-ticket-primary">Finalizar Compra</Text>
          </View>

          {/* Info Reserva */}
          <View className="bg-white p-5 rounded-2xl border border-ticket-line shadow-sm mb-6">
            <Text className="text-ticket-muted text-sm font-medium">Reserva ID</Text>
            <Text className="text-ticket-ink text-lg font-bold mb-2">#{String(reservationId).slice(-6)}</Text>
            
            <View className={`self-start px-4 py-2 rounded-full ${expired ? 'bg-red-100' : 'bg-blue-50'}`}>
              <Text className={`font-bold ${expired ? 'text-red-600' : 'text-ticket-primary'}`}>
                {expired ? "Tiempo Expirado" : `Expira en: ${formatTime(remainingMs)}`}
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View className="bg-white p-5 rounded-2xl border border-ticket-line shadow-sm mb-8">
            <Text className="text-xl font-bold text-ticket-ink mb-4">Datos del Comprador</Text>
            
            <View className="mb-4">
              <Text className="text-ticket-muted mb-1 ml-1 font-medium">Nombre Completo</Text>
              <TextInput 
                value={buyerName} onChangeText={setBuyerName} placeholder="Ej: Ernesto Pérez" 
                className="bg-ticket-bg border border-ticket-line rounded-xl p-4 text-ticket-ink font-medium"
              />
            </View>
            <View>
              <Text className="text-ticket-muted mb-1 ml-1 font-medium">Correo</Text>
              <TextInput 
                value={buyerEmail} onChangeText={setBuyerEmail} placeholder="correo@ejemplo.com" keyboardType="email-address"
                className="bg-ticket-bg border border-ticket-line rounded-xl p-4 text-ticket-ink font-medium"
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleConfirmPurchase} disabled={processing || expired}
            className={`py-4 rounded-xl shadow-md mb-10 ${expired ? 'bg-gray-400' : 'bg-ticket-primary'}`}
          >
            {processing ? <ActivityIndicator color="white" /> : 
              <Text className="text-white font-bold text-lg text-center">Confirmar Pago</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}