import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../api';

// 10 minutos en milisegundos
const RESERVE_WINDOW_MS = 10 * 60 * 1000; 

export default function CheckoutScreen() {
  const router = useRouter();
  // Recibimos el ID de la reserva por la URL
  const { reservationId } = useLocalSearchParams();

  const [reservation, setReservation] = useState<any>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Estado del contador
  const [remainingMs, setRemainingMs] = useState(RESERVE_WINDOW_MS);
  const [expired, setExpired] = useState(false);

  // 1. Cargar la reserva desde la API usando el ID
  // (Simplifiqué la lógica de sessionStorage de tu web, aquí confiamos en la API)
  useEffect(() => {
    let mounted = true;
    if (!reservationId) return;

    // Simulamos un tiempo de expiración local (10 min desde que carga la pantalla)
    // En una app real, el backend debería decirte cuándo expira.
    const expiresAt = Date.now() + RESERVE_WINDOW_MS;

    (async () => {
      try {
        // Nota: Asumo que tienes un endpoint para obtener una reserva específica.
        // Si no lo tienes, usamos los datos que pasamos (si fuera necesario).
        // Por ahora, simularemos que la reserva es válida si tenemos el ID.
        setReservation({
           reservation_id: reservationId,
           // Estos datos deberían venir del backend idealmente
           status: 'PENDING',
           expires_at: expiresAt
        });
      } catch (e) {
        Alert.alert("Error", "No se encontró la reserva");
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [reservationId]);

  // 2. Contador de tiempo (Timer)
  useEffect(() => {
    if (!reservation) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const expires = reservation.expires_at;
      const left = Math.max(0, expires - now);
      
      setRemainingMs(left);
      if (left <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  // Formato MM:SS
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // 3. Confirmar Compra
  const handleConfirmPurchase = async () => {
    if (expired) {
      Alert.alert("Expirado", "El tiempo de reserva ha terminado.");
      return;
    }
    if (!buyerName.trim() || !buyerEmail.trim()) {
      Alert.alert("Faltan datos", "Por favor completa tu nombre y correo.");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        reservation_id: reservationId,
        buyer: { name: buyerName.trim(), email: buyerEmail.trim() },
        payment_method: "card_simulated",
      };

      await api.checkout(payload);
      
      // Éxito: Navegar al historial o pantalla de éxito
      Alert.alert("¡Éxito!", "Compra realizada correctamente.");
      
      // Usamos replace para que no pueda volver atrás al checkout
      router.replace("/"); 
      
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo procesar el pago.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-ticket-bg">
        <ActivityIndicator size="large" color="#0056FF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ticket-bg">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-5">
          
          <Text className="text-3xl font-extrabold text-ticket-primary mb-6">Checkout</Text>

          {/* Tarjeta de Estado */}
          <View className="bg-white p-5 rounded-2xl border border-ticket-line shadow-sm mb-6">
            <Text className="text-ticket-muted text-sm mb-1">ID Reserva</Text>
            <Text className="text-ticket-ink font-bold mb-4">{reservationId}</Text>

            <View className={`self-start px-3 py-1 rounded-full ${expired ? 'bg-red-100' : 'bg-blue-50'}`}>
              <Text className={`font-bold ${expired ? 'text-red-600' : 'text-ticket-primary'}`}>
                {expired ? "Tiempo Expirado" : `Tiempo restante: ${formatTime(remainingMs)}`}
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View className="bg-white p-5 rounded-2xl border border-ticket-line shadow-sm mb-8">
            <Text className="text-xl font-bold text-ticket-ink mb-4">Tus Datos</Text>
            
            <View className="mb-4">
              <Text className="text-ticket-muted mb-2 font-medium">Nombre Completo</Text>
              <TextInput 
                value={buyerName}
                onChangeText={setBuyerName}
                placeholder="Ej: Juan Pérez"
                className="bg-ticket-bg border border-ticket-line rounded-xl p-4 text-ticket-ink"
                editable={!expired}
              />
            </View>

            <View className="mb-2">
              <Text className="text-ticket-muted mb-2 font-medium">Correo Electrónico</Text>
              <TextInput 
                value={buyerEmail}
                onChangeText={setBuyerEmail}
                placeholder="juan@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-ticket-bg border border-ticket-line rounded-xl p-4 text-ticket-ink"
                editable={!expired}
              />
            </View>
          </View>

          {/* Botón de Pago */}
          <TouchableOpacity 
            onPress={handleConfirmPurchase}
            disabled={processing || expired}
            className={`py-4 rounded-xl shadow-md ${expired ? 'bg-gray-400' : 'bg-ticket-primary'}`}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg text-center">
                {expired ? "Reserva Vencida" : "Confirmar Compra"}
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}