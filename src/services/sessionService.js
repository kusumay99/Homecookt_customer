// src/services/sessionService.js

import AsyncStorage from "@react-native-async-storage/async-storage";

class SessionService {
  // ==========================================================
  // STORAGE KEYS
  // ==========================================================

  static TOKEN_KEY = "access_token";
  static USER_ID_KEY = "userid";

  // ==========================================================
  // SAVE SESSION
  // ==========================================================

  static async saveSession({ token, userId }) {
    try {
      if (!token) {
        console.warn(
          "⚠️ SessionService: Token is empty"
        );
        return false;
      }

      if (
        userId === null ||
        userId === undefined
      ) {
        console.warn(
          "⚠️ SessionService: User ID is missing"
        );
        return false;
      }

      await AsyncStorage.setItem(
        this.TOKEN_KEY,
        String(token)
      );

      await AsyncStorage.setItem(
        this.USER_ID_KEY,
        String(userId)
      );

      console.log(
        "✅ Session saved successfully"
      );

      return true;
    } catch (error) {
      console.error(
        "❌ SAVE SESSION ERROR:",
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
      const token =
        await AsyncStorage.getItem(
          this.TOKEN_KEY
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
  // GET USER ID
  // ==========================================================

  static async getUserId() {
    try {
      const userId =
        await AsyncStorage.getItem(
          this.USER_ID_KEY
        );

      if (userId === null) {
        return null;
      }

      // Convert String back to Integer
      const parsedUserId =
        parseInt(userId, 10);

      if (Number.isNaN(parsedUserId)) {
        return null;
      }

      return parsedUserId;
    } catch (error) {
      console.error(
        "❌ GET USER ID ERROR:",
        error
      );

      return null;
    }
  }

  // ==========================================================
  // GET COMPLETE SESSION
  // ==========================================================
  //
  // Flutter returns:
  //
  // {
  //   'token': ...,
  //   'userId': ...
  // }
  //
  // ==========================================================

  static async getSession() {
    try {
      const [token, userId] =
        await AsyncStorage.multiGet([
          this.TOKEN_KEY,
          this.USER_ID_KEY,
        ]);

      const tokenValue = token[1];
      const userIdValue = userId[1];

      let parsedUserId = null;

      if (userIdValue !== null) {
        const parsed =
          parseInt(userIdValue, 10);

        if (!Number.isNaN(parsed)) {
          parsedUserId = parsed;
        }
      }

      return {
        token: tokenValue,
        userId: parsedUserId,
      };
    } catch (error) {
      console.error(
        "❌ GET SESSION ERROR:",
        error
      );

      return {
        token: null,
        userId: null,
      };
    }
  }

  // ==========================================================
  // CHECK LOGIN STATUS
  // ==========================================================

  static async isLoggedIn() {
    try {
      const token =
        await this.getToken();

      return (
        token !== null &&
        token.trim().length > 0
      );
    } catch (error) {
      console.error(
        "❌ LOGIN STATUS ERROR:",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // CLEAR SESSION / LOGOUT
  // ==========================================================

  static async clearSession() {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_ID_KEY,
      ]);

      console.log(
        "✅ Session cleared successfully"
      );

      return true;
    } catch (error) {
      console.error(
        "❌ CLEAR SESSION ERROR:",
        error
      );

      return false;
    }
  }
}

export default SessionService;