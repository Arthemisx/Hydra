import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack 
  screenOptions={{
      headerShown: false,
      title: "Hydra",
      //não funciona
      headerBackIcon: {
      type: 'image',
      source: require('C:/Users/CARMEN/MAUÁ/CIC/projeto-integrador-3/Hydra_v2/src/images/logo-sao-camilo.jpg'),
    }
    }}
    >
    
    <Stack.Screen
      name="HYdra"/>;
      </Stack>
}
