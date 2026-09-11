// src/services/authService.js

import AsyncStorage from "@react-native-async-storage/async-storage";

class AuthService {
  static TOKEN_KEY = "access_token";

  // ==========================================================
  // SAVE TOKEN
  // ==========================================================

  static async saveToken(token) {
    try {
      if (!token) {
        console.warn("⚠️ AuthService: Token is empty");
        return false;
      }

      await AsyncStorage.setItem(
        this.TOKEN_KEY,
        token
      );

      console.log("✅ Auth token saved");

      return true;
    } catch (error) {
      console.error(
        "❌ SAVE TOKEN ERROR:",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  static async getToken() {
    try {
      const token = await AsyncStorage.getItem(
        this.TOKEN_KEY
      );

      console.log(
        "🔐 AUTH TOKEN:",
        token ? "Token found" : "No token"
      );

      return token;
    } catch (error) {
      console.error(
        "❌ GET TOKEN ERROR:",
        error
      );

      return null;
    }
  }

  // ==========================================================
  // DELETE TOKEN / LOGOUT
  // ==========================================================

  static async clearToken() {
    try {
      await AsyncStorage.removeItem(
        this.TOKEN_KEY
      );

      console.log("✅ Auth token cleared");

      return true;
    } catch (error) {
      console.error(
        "❌ CLEAR TOKEN ERROR:",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // CHECK LOGIN STATUS
  // ==========================================================

  static async isLoggedIn() {
    try {
      const token = await this.getToken();

      return !!token;
    } catch (error) {
      console.error(
        "❌ LOGIN STATUS ERROR:",
        error
      );

      return false;
    }
  }
}

export default AuthService;