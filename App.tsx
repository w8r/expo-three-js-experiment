import * as React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Viewer } from "./src/Viewer";

export default function App() {
  const { width, height } = Dimensions.get("window");
  return (
    <View style={styles.container}>
      <Viewer {...{ width, height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
