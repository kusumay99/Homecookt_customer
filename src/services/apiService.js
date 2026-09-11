// src/services/apiService.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://api.homecookt.com";

const REQUEST_TIMEOUT = 20000;

/**
 * ============================================================
 * API SERVICE
 * ============================================================
 *
 * React Native equivalent of Flutter ApiService
 *
 * Token:
 *   AsyncStorage key: access_token
 *
 * Base URL:
 *   https://api.homecookt.com
 *
 * ============================================================
 */

class ApiService {
  static baseUrl = BASE_URL;

  // ==========================================================
  // TOKEN
  // ==========================================================

  static async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem("access_token");

      console.log("🔐 TOKEN:", token ? "Token found" : "No token");

      return token;
    } catch (error) {
      console.error("❌ TOKEN ERROR:", error);

      return null;
    }
  }

  // ==========================================================
  // HEADERS
  // ==========================================================

  static async authHeaders() {
    const token = await this.getAccessToken();

    return {
      Accept: "application/json",
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  }

  // ==========================================================
  // REQUEST WITH TIMEOUT
  // ==========================================================

  static async request(url, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      console.log("🚀 API REQUEST:", url);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log("✅ API STATUS:", response.status);

      const text = await response.text();

      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error("❌ JSON PARSE ERROR:", parseError);
        data = null;
      }

      if (!response.ok) {
        console.error("❌ API ERROR:", data || text);

        return {
          success: false,
          status: response.status,
          data,
          message:
            data?.message ||
            data?.detail ||
            data?.error ||
            text ||
            "Something went wrong",
        };
      }

      return {
        success: true,
        status: response.status,
        data,
      };
    } catch (error) {
      clearTimeout(timeout);

      if (error?.name === "AbortError") {
        console.error("❌ API TIMEOUT:", url);

        return {
          success: false,
          status: 408,
          data: null,
          message: "Request timed out. Please try again.",
        };
      }

      console.error("❌ API REQUEST ERROR:", error);

      return {
        success: false,
        status: 0,
        data: null,
        message:
          error?.message || "Unable to connect to the server.",
      };
    }
  }

  // ==========================================================
  // GET FOOD ITEMS
  // ==========================================================

  static async getFoodItems() {
    try {
      const headers = await this.authHeaders();

      const url = `${BASE_URL}/api/v1/get/fooditems`;

      console.log("🚀 FOOD API:", url);

      const result = await this.request(url, {
        method: "GET",
        headers,
      });

      console.log("✅ FOOD STATUS:", result.status);

      if (!result.success) {
        console.error("❌ FOOD API ERROR:", result.message);

        return [];
      }

      const decoded = result.data;

      let items = [];

      // Backend returned a direct array
      if (Array.isArray(decoded)) {
        items = decoded;
      }

      // Backend returned an object
      else if (
        decoded &&
        typeof decoded === "object"
      ) {
        items =
          decoded.data ??
          decoded.fooditems ??
          decoded.foods ??
          [];
      }

      if (!Array.isArray(items)) {
        console.warn(
          "⚠️ FOOD ITEMS RESPONSE IS NOT AN ARRAY"
        );

        return [];
      }

      console.log(
        `🍔 FOOD ITEMS COUNT: ${items.length}`
      );

      return items.map((item) =>
        this.mapDish(item)
      );
    } catch (error) {
      console.error(
        "❌ FOOD ITEMS ERROR:",
        error
      );

      return [];
    }
  }

  // ==========================================================
  // GET ONLINE KITCHENS
  // ==========================================================

  static async getOnlineKitchens() {
    try {
      const headers = await this.authHeaders();

      const url =
        `${BASE_URL}/api/v1/onlinekitchens`;

      console.log("🚀 KITCHENS API:", url);

      const result = await this.request(url, {
        method: "GET",
        headers,
      });

      console.log(
        "✅ KITCHENS STATUS:",
        result.status
      );

      if (!result.success) {
        console.error(
          "❌ KITCHENS API ERROR:",
          result.message
        );

        return [];
      }

      const decoded = result.data;

      let kitchens = [];

      // Backend returned direct array
      if (Array.isArray(decoded)) {
        kitchens = decoded;
      }

      // Backend returned object
      else if (
        decoded &&
        typeof decoded === "object"
      ) {
        kitchens =
          decoded.data ??
          decoded.kitchens ??
          decoded.results ??
          [];
      }

      if (!Array.isArray(kitchens)) {
        console.warn(
          "⚠️ KITCHENS RESPONSE IS NOT AN ARRAY"
        );

        return [];
      }

      console.log(
        `🏠 KITCHENS COUNT: ${kitchens.length}`
      );

      return kitchens.map((kitchen) =>
        this.mapKitchen(kitchen)
      );
    } catch (error) {
      console.error(
        "❌ KITCHENS ERROR:",
        error
      );

      return [];
    }
  }

  // ==========================================================
  // GET ONLINE KITCHENS WITH FOOD
  // ==========================================================

  static async getOnlineKitchensWithFood() {
    try {
      const headers = await this.authHeaders();

      const url =
        `${BASE_URL}/api/v1/onlinekitchens-with-food`;

      console.log(
        "🚀 KITCHENS WITH FOOD API:",
        url
      );

      const result = await this.request(url, {
        method: "GET",
        headers,
      });

      console.log(
        "✅ KITCHENS WITH FOOD STATUS:",
        result.status
      );

      if (!result.success) {
        console.error(
          "❌ KITCHENS WITH FOOD ERROR:",
          result.message
        );

        return [];
      }

      const decoded = result.data;

      let kitchens = [];

      // Backend returned direct array
      if (Array.isArray(decoded)) {
        kitchens = decoded;
      }

      // Backend returned object
      else if (
        decoded &&
        typeof decoded === "object"
      ) {
        kitchens =
          decoded.data ??
          decoded.kitchens ??
          decoded.results ??
          [];
      }

      if (!Array.isArray(kitchens)) {
        console.warn(
          "⚠️ KITCHENS WITH FOOD RESPONSE IS NOT AN ARRAY"
        );

        return [];
      }

      console.log(
        `🏠🍔 KITCHENS WITH FOOD COUNT: ${kitchens.length}`
      );

      return kitchens.map((kitchen) =>
        this.mapKitchen(kitchen)
      );
    } catch (error) {
      console.error(
        "❌ KITCHENS WITH FOOD ERROR:",
        error
      );

      return [];
    }
  }

  // ==========================================================
  // DISH MAPPER
  // ==========================================================
  //
  // Flutter:
  // Dish.fromJson(...)
  //
  // React Native does not require a model class.
  //
  // This keeps the backend object intact while providing
  // commonly-used normalized fields.
  //
  // ==========================================================

  static mapDish(item) {
    if (!item || typeof item !== "object") {
      return item;
    }

    return {
      ...item,

      id:
        item.id ??
        item.food_id ??
        item._id,

      name:
        item.name ??
        item.food_name ??
        item.title ??
        "",

      description:
        item.description ?? "",

      price:
        item.price ??
        item.food_price ??
        0,

      image:
        item.image ??
        item.food_image ??
        item.food_photo ??
        item.image_url ??
        "",

      category:
        item.category ??
        "",

      rating:
        item.rating ??
        item.average_rating ??
        0,

      prepTime:
        item.prepTime ??
        item.preparation_time ??
        item.prep_time ??
        0,

      availableQuantity:
        item.availableQuantity ??
        item.available_quantity ??
        item.quantity ??
        0,
    };
  }

  // ==========================================================
  // KITCHEN MAPPER
  // ==========================================================
  //
  // Flutter:
  // Kitchen.fromJson(...)
  //
  // ==========================================================

  static mapKitchen(kitchen) {
    if (
      !kitchen ||
      typeof kitchen !== "object"
    ) {
      return kitchen;
    }

    return {
      ...kitchen,

      id:
        kitchen.id ??
        kitchen.kitchen_id ??
        kitchen._id,

      name:
        kitchen.name ??
        kitchen.kitchen_name ??
        kitchen.title ??
        "",

      description:
        kitchen.description ?? "",

      image:
        kitchen.image ??
        kitchen.kitchen_photo ??
        kitchen.kitchen_image ??
        kitchen.image_url ??
        "",

      address:
        kitchen.address ??
        kitchen.location ??
        "",

      phone:
        kitchen.phone ??
        kitchen.phone_number ??
        "",

      rating:
        kitchen.rating ??
        kitchen.average_rating ??
        0,

      foods:
        kitchen.foods ??
        kitchen.food_items ??
        kitchen.items ??
        [],
    };
  }
}

export default ApiService;