import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      if (token) {
        router.replace("/Main_navigation");
      } else {
        router.replace("/Login_screen");
      }
    } catch (error) {
      console.log("Session check error:", error);
      router.replace("/Login_screen");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}