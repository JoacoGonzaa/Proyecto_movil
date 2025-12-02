// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppProvider } from "./src/contexts/AppContext";

import EventsScreen from "./src/screens/EventsScreen";
import EventDetail from "./src/screens/EventDetail";
import ReservationScreen from "./src/screens/ReservationScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import PurchasesScreen from "./src/screens/PurchasesScreen";

export type RootStackParamList = {
  Events: undefined;
  EventDetail: { id: string };
  Reservation: {
    reservationId?: string;
    eventId?: string;
    ticketIndex?: number;
    ticketName?: string;
    unitPrice?: number;
  };
  Checkout: { reservationId: string };
  Purchases: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Events">
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="EventDetail" component={EventDetail} />
          <Stack.Screen name="Reservation" component={ReservationScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Purchases" component={PurchasesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
