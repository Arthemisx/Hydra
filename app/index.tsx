import { Text, View } from "react-native";
import App from "./App";
import Cadastro from "./Cadastro";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <App></App> */}
      <Cadastro></Cadastro>
    </View>
  );
}
