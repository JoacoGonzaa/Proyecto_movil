// components/EventCard.tsx
import React from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';


const EventCard = ({ title, date, imageUrl, onPress }: any) => {
  return (
    // Contenedor principal
    <View className="bg-ticket-card rounded-2xl mb-6 overflow-hidden border border-ticket-line shadow-sm android:elevation-3">
      <Image 
        source={{ uri: imageUrl || 'https://via.placeholder.com/600x400?text=Sin+Imagen' }} //imagenes por defecto
        className="w-full h-48 bg-gray-200" 
        resizeMode="cover"
      />
      
        <View className="flex-row items-start justify-between p-5">
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-ticket-ink mb-2" numberOfLines={2}>
          {title}
            </Text>
            <Text className="text-sm text-ticket-muted font-medium">
          {date}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-ticket-primary py-3 px-6 rounded-xl shadow-sm ml-3"
            style={Platform.OS === 'android' ? { elevation: 2 } : {}}
          > 
            <Text className="text-white font-bold text-center text-base tracking-wide">
          Ingresar
            </Text>
          </TouchableOpacity>
        </View>
          </View>
        );
      };

export default EventCard;