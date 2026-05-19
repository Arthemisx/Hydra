import { Stack } from "expo-router";

import { FeedbackProvider } from "@/components/FeedbackProvider";

export default function RootLayout() {
  return (
    <FeedbackProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FeedbackProvider>
  );
}
