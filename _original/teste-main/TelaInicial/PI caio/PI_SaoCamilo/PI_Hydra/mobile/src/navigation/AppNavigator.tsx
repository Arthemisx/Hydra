import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../lib/theme";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import PreSessionScreen from "../screens/PreSessionScreen";
import DuringSessionScreen from "../screens/DuringSessionScreen";
import PostSessionScreen from "../screens/PostSessionScreen";
import ResultScreen from "../screens/ResultScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.redPrimary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Cadastro" }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PreSession" component={PreSessionScreen} options={{ title: "Pre-sessao" }} />
      <Stack.Screen name="DuringSession" component={DuringSessionScreen} options={{ title: "Durante" }} />
      <Stack.Screen name="PostSession" component={PostSessionScreen} options={{ title: "Pos-sessao" }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Resultado" }} />
    </Stack.Navigator>
  );
}
