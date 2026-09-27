import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { useApp } from "./_layout";

export default function Index() {
  const { colors } = useApp();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token =
        await AsyncStorage.getItem("access_token");

      if (token) {
        router.replace("/Main_navigation");
      } else {
        router.replace("/Login_screen");
      }
    } catch (error) {
      console.log(
        "SESSION CHECK ERROR:",
        error
      );

      router.replace("/Login_screen");
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ActivityIndicator
        size="large"
        color={colors.orange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
