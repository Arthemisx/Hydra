import { ScrollView, Text, View } from "react-native";

import { infoStyles } from "./info.styles";

type Props = {
  title: string;
  paragraphs: string[];
};

export function InfoScreen({ title, paragraphs }: Props) {
  return (
    <ScrollView style={infoStyles.screen} contentContainerStyle={infoStyles.scrollContent}>
      <Text style={infoStyles.title}>{title}</Text>
      <View style={infoStyles.card}>
        {paragraphs.map((p, i) => (
          <Text key={i} style={infoStyles.paragraph}>
            {p}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
