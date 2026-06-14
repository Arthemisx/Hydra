import { Stack } from "expo-router";
import { ProvedorFeedback } from "@/componentes/ProvedorFeedback";
import VLibras from "@/componentes/VLibras";

export default function RootLayout() {
  return (
    <ProvedorFeedback>
      <VLibras forceOnload />
      <Stack screenOptions={{ headerShown: false }} />
    </ProvedorFeedback>
  );
}
