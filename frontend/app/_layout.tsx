import { Stack } from "expo-router";

import { ProvedorFeedback } from "@/componentes/ProvedorFeedback";

export default function RootLayout() {
  return (
    <ProvedorFeedback>
      <Stack screenOptions={{ headerShown: false }} />
    </ProvedorFeedback>
  );
}
