import * as React from "react";
import { StyleSheet, View, Dimensions, Text } from "react-native";
import { Vis } from "./src";

export default function App() {
  const { width, height } = Dimensions.get("window");
  return (
    <View style={styles.container}>
      <Vis {...{ width, height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
