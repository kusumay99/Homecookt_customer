import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "./_layout";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// SETTINGS
// ============================================================

const NEARBY_RADIUS_KM = 15;

const SELECTED_LOCATION_KEY =
  "homecookt_selected_location";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#F97316",
  gold: "#FBBF24",

  background: "#FEF8F3",
  dark: "#0F0E0D",

  white: "#FFFFFF",

  muted: "#777777",
  border: "#EEEEEE",

  lightOrange: "#FFF1E7",

  green: "#16A34A",
  red: "#EF4444",

  darkCard: "#1A1816",
  darkBorder: "#302C29",
  darkMuted: "#A7A19C",
};

// ============================================================
// SAFE NUMBER
// ============================================================

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

// ============================================================
// HAVERSINE DISTANCE
// ============================================================

function calculateDistanceKm(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const lat1 = toNumber(latitude1);
  const lon1 = toNumber(longitude1);
  const lat2 = toNumber(latitude2);
  const lon2 = toNumber(longitude2);

  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return null;
  }

  const earthRadiusKm = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen() {
  // ==========================================================
  // THEME
  // ==========================================================

  const {
    isDarkMode,
    toggleTheme,
  } = useApp();

  // ==========================================================
  // DATA STATE
  // ==========================================================

  const [user, setUser] =
    useState(null);

  const [topRatedFoods, setTopRatedFoods] =
    useState([]);

  const [recommendedFoods, setRecommendedFoods] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // ==========================================================
  // LOCATION
  // ==========================================================

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(null);

  const [
    locationText,
    setLocationText,
  ] = useState("");

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  const [
    locationError,
    setLocationError,
  ] = useState("");

  // ==========================================================
  // THEME COLORS
  // ==========================================================

  const backgroundColor =
    isDarkMode
      ? COLORS.dark
      : COLORS.background;

  const cardColor =
    isDarkMode
      ? COLORS.darkCard
      : COLORS.white;

  const textColor =
    isDarkMode
      ? COLORS.white
      : COLORS.dark;

  const mutedColor =
    isDarkMode
      ? COLORS.darkMuted
      : COLORS.muted;

  const borderColor =
    isDarkMode
      ? COLORS.darkBorder
      : COLORS.border;

  const softColor =
    isDarkMode
      ? "#241F1B"
      : COLORS.lightOrange;

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken =
    useCallback(async () => {
      try {
        const keys = [
          "access_token",
          "accessToken",
          "token",
        ];

        for (const key of keys) {
          const value =
            await AsyncStorage.getItem(
              key
            );

          if (
            value &&
            value.trim()
          ) {
            return value.trim();
          }
        }

        return null;
      } catch (error) {
        console.log(
          "GET TOKEN ERROR:",
          error
        );

        return null;
      }
    }, []);

  // ==========================================================
  // HEADERS
  // ==========================================================

  const getHeaders =
    useCallback(async () => {
      const token =
        await getToken();

      const headers = {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      return headers;
    }, [getToken]);

  // ==========================================================
  // PARSE JSON RESPONSE
  // ==========================================================

  const parseJsonResponse =
    useCallback(async (response) => {
      const text =
        await response.text();

      if (!text) {
        return {};
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.log(
          "INVALID JSON RESPONSE:",
          text.substring(0, 500)
        );

        return {};
      }
    }, []);

  // ==========================================================
  // EXTRACT FOOD ARRAY
  // ==========================================================

  const extractFoods =
    useCallback((data) => {
      if (Array.isArray(data)) {
        return data;
      }

      const possibleArrays = [
        data?.foods,
        data?.food_items,
        data?.foodItems,
        data?.items,
        data?.results,
        data?.recommendations,
        data?.data,
        data?.data?.foods,
        data?.data?.food_items,
        data?.data?.foodItems,
        data?.data?.items,
        data?.data?.results,
        data?.data?.recommendations,
      ];

      for (
        const value of possibleArrays
      ) {
        if (Array.isArray(value)) {
          return value;
        }
      }

      return [];
    }, []);

  // ==========================================================
  // IMAGE VALIDATION
  // ==========================================================

  const isValidImage =
    useCallback((value) => {
      if (
        !value ||
        typeof value !== "string"
      ) {
        return false;
      }

      const valueLower =
        value.trim().toLowerCase();

      return (
        valueLower.startsWith(
          "http://"
        ) ||
        valueLower.startsWith(
          "https://"
        )
      );
    }, []);

  // ==========================================================
  // FOOD IMAGE
  // ==========================================================

  const getFoodImage =
    useCallback(
      (food) => {
        if (!food) {
          return null;
        }

        const candidates = [
          food.image,
          food.image_url,
          food.imageUrl,
          food.photo,
          food.photo_url,
          food.food_image,
          food.food_image_url,
          food.thumbnail,
          food.thumbnail_url,

          food.images?.[0],
          food.photos?.[0],
          food.image_urls?.[0],
          food.food_images?.[0],
        ];

        for (
          const candidate of candidates
        ) {
          if (
            typeof candidate ===
              "object" &&
            candidate !== null
          ) {
            const nested =
              candidate.url ||
              candidate.uri ||
              candidate.image_url;

            if (
              isValidImage(
                nested
              )
            ) {
              return nested.trim();
            }
          }

          if (
            isValidImage(candidate)
          ) {
            return candidate.trim();
          }
        }

        return null;
      },
      [isValidImage]
    );

  // ==========================================================
  // FIND LATITUDE
  // ==========================================================

  const getLatitude =
    useCallback((food) => {
      if (!food) {
        return null;
      }

      const candidates = [
        // Food
        food.latitude,
        food.lat,

        // Kitchen
        food.kitchen?.latitude,
        food.kitchen?.lat,

        // Kitchen details
        food.kitchen_details?.latitude,
        food.kitchen_details?.lat,

        // Kitchen location
        food.kitchen_location?.latitude,
        food.kitchen_location?.lat,

        // Generic location
        food.location?.latitude,
        food.location?.lat,

        // Coordinates
        food.coordinates?.latitude,
        food.coordinates?.lat,

        // GeoJSON coordinates:
        // [longitude, latitude]
        food.coordinates?.[1],

        // Kitchen nested location
        food.kitchen?.location?.latitude,
        food.kitchen?.location?.lat,

        // Kitchen coordinates
        food.kitchen?.coordinates?.latitude,
        food.kitchen?.coordinates?.lat,
        food.kitchen?.coordinates?.[1],

        // Common backend naming
        food.kitchen_latitude,
        food.kitchen_lat,

        food.location_latitude,
        food.location_lat,

        food.lat_coordinate,
      ];

      for (
        const value of candidates
      ) {
        const number =
          toNumber(value);

        if (
          number !== null &&
          number >= -90 &&
          number <= 90
        ) {
          return number;
        }
      }

      return null;
    }, []);

  // ==========================================================
  // FIND LONGITUDE
  // ==========================================================

  const getLongitude =
    useCallback((food) => {
      if (!food) {
        return null;
      }

      const candidates = [
        // Food
        food.longitude,
        food.lng,
        food.lon,

        // Kitchen
        food.kitchen?.longitude,
        food.kitchen?.lng,
        food.kitchen?.lon,

        // Kitchen details
        food.kitchen_details?.longitude,
        food.kitchen_details?.lng,

        // Kitchen location
        food.kitchen_location?.longitude,
        food.kitchen_location?.lng,

        // Generic location
        food.location?.longitude,
        food.location?.lng,

        // Coordinates
        food.coordinates?.longitude,
        food.coordinates?.lng,

        // GeoJSON coordinates:
        // [longitude, latitude]
        food.coordinates?.[0],

        // Kitchen nested location
        food.kitchen?.location?.longitude,
        food.kitchen?.location?.lng,

        // Kitchen coordinates
        food.kitchen?.coordinates?.longitude,
        food.kitchen?.coordinates?.lng,
        food.kitchen?.coordinates?.[0],

        // Common backend naming
        food.kitchen_longitude,
        food.kitchen_lng,

        food.location_longitude,
        food.location_lng,

        food.lng_coordinate,
      ];

      for (
        const value of candidates
      ) {
        const number =
          toNumber(value);

        if (
          number !== null &&
          number >= -180 &&
          number <= 180
        ) {
          return number;
        }
      }

      return null;
    }, []);

  // ==========================================================
  // NORMALIZE FOOD
  // ==========================================================

  const normalizeFood =
    useCallback(
      (food) => {
        if (
          !food ||
          typeof food !==
            "object"
        ) {
          return null;
        }

        const id =
          food.id ??
          food.food_id ??
          food.foodId ??
          food._id;

        if (
          id === undefined ||
          id === null ||
          id === ""
        ) {
          return null;
        }

        const latitude =
          getLatitude(food);

        const longitude =
          getLongitude(food);

        const rating =
          toNumber(
            food.rating ??
              food.average_rating ??
              food.avg_rating ??
              food.food_rating ??
              food.averageRating
          ) ?? 0;

        return {
          ...food,

          id,

          latitude,
          longitude,

          name:
            food.name ??
            food.food_name ??
            food.foodName ??
            "Food",

          price:
            food.price ??
            food.food_price ??
            food.foodPrice ??
            0,

          rating,

          description:
            food.description ??
            food.food_description ??
            "Homemade with love",
        };
      },
      [
        getLatitude,
        getLongitude,
      ]
    );

  // ==========================================================
  // FILTER ALL FOODS WITHIN 15 KM
  // ==========================================================

  const getNearbyFoods =
    useCallback(
      (
        foods,
        location
      ) => {
        if (
          !Array.isArray(foods)
        ) {
          return [];
        }

        if (
          !location
        ) {
          return [];
        }

        const userLatitude =
          toNumber(
            location.latitude
          );

        const userLongitude =
          toNumber(
            location.longitude
          );

        if (
          userLatitude === null ||
          userLongitude === null
        ) {
          return [];
        }

        const nearby = [];

        for (
          const food of foods
        ) {
          const normalized =
            normalizeFood(food);

          if (!normalized) {
            continue;
          }

          if (
            normalized.latitude ===
              null ||
            normalized.longitude ===
              null
          ) {
            console.log(
              "FOOD/KITCHEN HAS NO COORDINATES:",
              normalized.name,
              normalized.id
            );

            continue;
          }

          const distance =
            calculateDistanceKm(
              userLatitude,
              userLongitude,
              normalized.latitude,
              normalized.longitude
            );

          if (
            distance === null
          ) {
            continue;
          }

          if (
            distance <=
            NEARBY_RADIUS_KM
          ) {
            nearby.push({
              ...normalized,

              distance_km:
                Number(
                  distance.toFixed(
                    1
                  )
                ),
            });
          }
        }

        return nearby;
      },
      [normalizeFood]
    );

  // ==========================================================
  // LOAD USER
  // ==========================================================

  const loadUser =
    useCallback(async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            "user"
          );

        if (stored) {
          try {
            setUser(
              JSON.parse(stored)
            );

            return;
          } catch (error) {
            console.log(
              "STORED USER PARSE ERROR:",
              error
            );
          }
        }

        const token =
          await getToken();

        if (!token) {
          return;
        }

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/users/profile`,
            {
              method: "GET",
              headers,
            }
          );

        const data =
          await parseJsonResponse(
            response
          );

        if (response.ok) {
          const profile =
            data?.user ||
            data?.data ||
            data;

          if (
            profile &&
            typeof profile ===
              "object"
          ) {
            setUser(profile);

            await AsyncStorage.setItem(
              "user",
              JSON.stringify(
                profile
              )
            );
          }
        }
      } catch (error) {
        console.log(
          "LOAD USER ERROR:",
          error
        );
      }
    }, [
      getToken,
      getHeaders,
      parseJsonResponse,
    ]);

  // ==========================================================
  // UNREAD NOTIFICATIONS
  // ==========================================================

  const fetchUnreadCount =
    useCallback(async () => {
      try {
        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/notifications/unread-count`,
            {
              method: "GET",
              headers,
            }
          );

        const data =
          await parseJsonResponse(
            response
          );

        if (!response.ok) {
          setUnreadCount(0);
          return;
        }

        const count =
          data?.count ??
          data?.unread_count ??
          data?.unreadCount ??
          0;

        setUnreadCount(
          Number(count) || 0
        );
      } catch (error) {
        console.log(
          "NOTIFICATION COUNT ERROR:",
          error
        );

        setUnreadCount(0);
      }
    }, [
      getHeaders,
      parseJsonResponse,
    ]);

  // ==========================================================
  // FETCH ALL FOOD ITEMS
  //
  // IMPORTANT:
  // We intentionally use /get/fooditems here.
  //
  // This gives us ALL foods so we can filter them ourselves
  // according to the user's selected location.
  // ==========================================================

  const fetchNearbyFoods =
    useCallback(
      async (location) => {
        try {
          if (!location) {
            setTopRatedFoods([]);
            setRecommendedFoods([]);

            return [];
          }

          const headers =
            await getHeaders();

          const response =
            await fetch(
              `${BASE_URL}/api/v1/get/fooditems`,
              {
                method: "GET",
                headers,
              }
            );

          const data =
            await parseJsonResponse(
              response
            );

          console.log(
            "ALL FOOD ITEMS STATUS:",
            response.status
          );

          if (!response.ok) {
            console.log(
              "ALL FOOD ITEMS ERROR RESPONSE:",
              data
            );

            setTopRatedFoods([]);
            setRecommendedFoods([]);

            return [];
          }

          const foods =
            extractFoods(data);

          console.log(
            "TOTAL FOOD ITEMS FROM API:",
            foods.length
          );

          // ----------------------------------------------------
          // FILTER BY SELECTED LOCATION
          // ----------------------------------------------------

          const nearbyFoods =
            getNearbyFoods(
              foods,
              location
            );

          console.log(
            `FOODS WITHIN ${NEARBY_RADIUS_KM} KM:`,
            nearbyFoods.length
          );

          // ----------------------------------------------------
          // RECOMMENDED
          //
          // ALL nearby foods.
          // Nearest foods appear first.
          // ----------------------------------------------------

          const recommended =
            [...nearbyFoods].sort(
              (a, b) =>
                Number(
                  a.distance_km || 0
                ) -
                Number(
                  b.distance_km || 0
                )
            );

          // ----------------------------------------------------
          // TOP RATED
          //
          // ALL nearby foods.
          // Highest rated foods appear first.
          // Distance is the tie breaker.
          // ----------------------------------------------------

          const topRated =
            [...nearbyFoods].sort(
              (a, b) => {
                const ratingA =
                  Number(
                    a.rating || 0
                  );

                const ratingB =
                  Number(
                    b.rating || 0
                  );

                if (
                  ratingB !==
                  ratingA
                ) {
                  return (
                    ratingB -
                    ratingA
                  );
                }

                return (
                  Number(
                    a.distance_km ||
                      0
                  ) -
                  Number(
                    b.distance_km ||
                      0
                  )
                );
              }
            );

          setRecommendedFoods(
            recommended
          );

          setTopRatedFoods(
            topRated
          );

          return nearbyFoods;
        } catch (error) {
          console.log(
            "FETCH NEARBY FOOD ERROR:",
            error
          );

          setRecommendedFoods([]);
          setTopRatedFoods([]);

          return [];
        }
      },
      [
        getHeaders,
        parseJsonResponse,
        extractFoods,
        getNearbyFoods,
      ]
    );

  // ==========================================================
  // SAVE LOCATION
  // ==========================================================

  const saveSelectedLocation =
    useCallback(
      async (location) => {
        try {
          await AsyncStorage.setItem(
            SELECTED_LOCATION_KEY,
            JSON.stringify(
              location
            )
          );
        } catch (error) {
          console.log(
            "SAVE LOCATION ERROR:",
            error
          );
        }
      },
      []
    );

  // ==========================================================
  // LOAD SAVED LOCATION
  // ==========================================================

  const loadSavedLocation =
    useCallback(async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            SELECTED_LOCATION_KEY
          );

        if (!stored) {
          return null;
        }

        const parsed =
          JSON.parse(stored);

        if (
          !parsed ||
          parsed.latitude ===
            undefined ||
          parsed.longitude ===
            undefined
        ) {
          return null;
        }

        return parsed;
      } catch (error) {
        console.log(
          "LOAD SAVED LOCATION ERROR:",
          error
        );

        return null;
      }
    }, []);

  // ==========================================================
  // CURRENT DEVICE LOCATION
  // ==========================================================

  const getCurrentLocation =
    useCallback(async () => {
      try {
        setLocationError("");
        setLocationLoading(true);

        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          permission.status !==
          "granted"
        ) {
          setLocationError(
            "Location permission was not granted."
          );

          return null;
        }

        const position =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.Balanced,
            }
          );

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        let address =
          "Current Location";

        try {
          const addresses =
            await Location.reverseGeocodeAsync(
              {
                latitude,
                longitude,
              }
            );

          if (
            addresses &&
            addresses.length >
              0
          ) {
            const item =
              addresses[0];

            address = [
              item.name,
              item.street,
              item.district,
              item.city,
              item.region,
            ]
              .filter(Boolean)
              .join(", ");
          }
        } catch (error) {
          console.log(
            "REVERSE GEOCODE ERROR:",
            error
          );
        }

        const location = {
          latitude,
          longitude,
          address:
            address ||
            "Current Location",
        };

        setSelectedLocation(
          location
        );

        setLocationText(
          location.address
        );

        await saveSelectedLocation(
          location
        );

        // ------------------------------------------------------
        // IMPORTANT:
        // Immediately load ALL nearby foods.
        // ------------------------------------------------------

        await fetchNearbyFoods(
          location
        );

        return location;
      } catch (error) {
        console.log(
          "CURRENT LOCATION ERROR:",
          error
        );

        setLocationError(
          "Unable to get your current location."
        );

        return null;
      } finally {
        setLocationLoading(
          false
        );
      }
    }, [
      saveSelectedLocation,
      fetchNearbyFoods,
    ]);

  // ==========================================================
  // SEARCH / GEOCODE TYPED LOCATION
  // ==========================================================

  const searchLocation =
    useCallback(async () => {
      const query =
        locationText.trim();

      Keyboard.dismiss();

      if (!query) {
        Alert.alert(
          "Location Required",
          "Please enter a location such as Gachibowli, Hyderabad."
        );

        return;
      }

      try {
        setLocationError("");
        setLocationLoading(true);

        const results =
          await Location.geocodeAsync(
            query
          );

        if (
          !results ||
          results.length ===
            0
        ) {
          Alert.alert(
            "Location Not Found",
            `We could not find "${query}". Please enter a more specific location.`
          );

          return;
        }

        const result =
          results[0];

        const latitude =
          toNumber(
            result.latitude
          );

        const longitude =
          toNumber(
            result.longitude
          );

        if (
          latitude === null ||
          longitude === null
        ) {
          Alert.alert(
            "Invalid Location",
            "The selected location does not have valid coordinates."
          );

          return;
        }

        let displayAddress =
          query;

        try {
          const addresses =
            await Location.reverseGeocodeAsync(
              {
                latitude,
                longitude,
              }
            );

          if (
            addresses &&
            addresses.length >
              0
          ) {
            const item =
              addresses[0];

            const formatted = [
              item.name,
              item.street,
              item.district,
              item.city,
              item.region,
            ]
              .filter(Boolean)
              .join(", ");

            if (
              formatted.trim()
            ) {
              displayAddress =
                formatted;
            }
          }
        } catch (error) {
          console.log(
            "SEARCH REVERSE GEOCODE ERROR:",
            error
          );
        }

        const location = {
          latitude,
          longitude,
          address:
            displayAddress,
        };

        // ------------------------------------------------------
        // SET SELECTED LOCATION
        // ------------------------------------------------------

        setSelectedLocation(
          location
        );

        setLocationText(
          displayAddress
        );

        // ------------------------------------------------------
        // SAVE SELECTED LOCATION
        // ------------------------------------------------------

        await saveSelectedLocation(
          location
        );

        // ------------------------------------------------------
        // IMPORTANT:
        // Load ALL foods and filter using this exact location.
        // ------------------------------------------------------

        await fetchNearbyFoods(
          location
        );
      } catch (error) {
        console.log(
          "SEARCH LOCATION ERROR:",
          error
        );

        Alert.alert(
          "Location Search Error",
          "Unable to search this location. Please try again."
        );
      } finally {
        setLocationLoading(
          false
        );
      }
    }, [
      locationText,
      saveSelectedLocation,
      fetchNearbyFoods,
    ]);

  // ==========================================================
  // LOAD HOME
  // ==========================================================

  const loadHomeData =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setIsLoading(true);
          }

          await Promise.all([
            loadUser(),
            fetchUnreadCount(),
          ]);

          let location =
            await loadSavedLocation();

          // ----------------------------------------------------
          // No saved location:
          // use current device location.
          // ----------------------------------------------------

          if (!location) {
            location =
              await getCurrentLocation();
          } else {
            setSelectedLocation(
              location
            );

            setLocationText(
              location.address ||
                ""
            );
          }

          if (!location) {
            setTopRatedFoods([]);
            setRecommendedFoods([]);

            return;
          }

          // ----------------------------------------------------
          // Load ALL nearby foods.
          // ----------------------------------------------------

          await fetchNearbyFoods(
            location
          );
        } catch (error) {
          console.log(
            "HOME LOAD ERROR:",
            error
          );
        } finally {
          if (showLoader) {
            setIsLoading(false);
          }

          setRefreshing(false);
        }
      },
      [
        loadUser,
        fetchUnreadCount,
        loadSavedLocation,
        getCurrentLocation,
        fetchNearbyFoods,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadHomeData(true);
  }, [loadHomeData]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const onRefresh =
    useCallback(async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      try {
        let location =
          selectedLocation;

        if (!location) {
          location =
            await loadSavedLocation();
        }

        if (!location) {
          location =
            await getCurrentLocation();
        }

        if (location) {
          await Promise.all([
            fetchNearbyFoods(
              location
            ),
            loadUser(),
            fetchUnreadCount(),
          ]);
        }
      } catch (error) {
        console.log(
          "REFRESH ERROR:",
          error
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      refreshing,
      selectedLocation,
      loadSavedLocation,
      getCurrentLocation,
      fetchNearbyFoods,
      loadUser,
      fetchUnreadCount,
    ]);

  // ==========================================================
  // GREETING
  // ==========================================================

  const getGreeting =
    useCallback(() => {
      const hour =
        new Date().getHours();

      if (hour < 12) {
        return "Good Morning";
      }

      if (hour < 17) {
        return "Good Afternoon";
      }

      return "Good Evening";
    }, []);

  // ==========================================================
  // USER NAME
  // ==========================================================

  const getUserName =
    useCallback(() => {
      return (
        user?.name ||
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        "Food Lover"
      );
    }, [user]);

  // ==========================================================
  // USER IMAGE
  // ==========================================================

  const getUserImage =
    useCallback(() => {
      const image =
        user?.image ||
        user?.profile_photo ||
        user?.profilePhoto ||
        user?.profile_image ||
        user?.image_url;

      return isValidImage(
        image
      )
        ? image.trim()
        : null;
    }, [
      user,
      isValidImage,
    ]);

  // ==========================================================
  // OPEN DISH
  // ==========================================================

  const openDish =
    useCallback(
      (food) => {
        if (!food) {
          return;
        }

        const normalized =
          normalizeFood(food);

        if (
          normalized?.id ===
            null ||
          normalized?.id ===
            undefined ||
          normalized?.id ===
            ""
        ) {
          return;
        }

        router.push({
          pathname:
            "/Dish_detail_screen",

          params: {
            dish: JSON.stringify(
              normalized
            ),
          },
        });
      },
      [normalizeFood]
    );

  // ==========================================================
  // SEARCH SCREEN
  // ==========================================================

  const openSearch =
    useCallback(() => {
      router.push(
        "/Search_screen"
      );
    }, []);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const openNotifications =
    useCallback(() => {
      router.push(
        "/Notification_screen"
      );
    }, []);

  // ==========================================================
  // HORIZONTAL FOOD CARD
  // ==========================================================

  const HorizontalFoodCard =
    ({ item }) => {
      const image =
        getFoodImage(item);

      const name =
        item?.name ||
        item?.food_name ||
        "Food";

      const price =
        item?.price ??
        item?.food_price ??
        0;

      const rating =
        item?.rating ??
        item?.average_rating ??
        item?.avg_rating ??
        0;

      const distance =
        item?.distance_km;

      return (
        <TouchableOpacity
          activeOpacity={0.92}
          style={[
            styles.foodCard,
            {
              backgroundColor:
                cardColor,
              borderColor:
                borderColor,
            },
          ]}
          onPress={() =>
            openDish(item)
          }
        >
          <View
            style={
              styles.foodImageWrapper
            }
          >
            {image ? (
              <Image
                source={{
                  uri: image,
                }}
                style={
                  styles.foodImage
                }
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.noImage,
                  {
                    backgroundColor:
                      softColor,
                  },
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={38}
                  color={
                    COLORS.orange
                  }
                />
              </View>
            )}

            {/* RATING */}

            <View
              style={
                styles.ratingBadge
              }
            >
              <Ionicons
                name="star"
                size={12}
                color={
                  COLORS.gold
                }
              />

              <Text
                style={
                  styles.ratingText
                }
              >
                {Number(
                  rating || 0
                ).toFixed(1)}
              </Text>
            </View>

            {/* DISTANCE */}

            {distance !==
              undefined &&
              distance !==
                null && (
                <View
                  style={
                    styles.distanceBadge
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={11}
                    color={
                      COLORS.white
                    }
                  />

                  <Text
                    style={
                      styles.distanceBadgeText
                    }
                  >
                    {Number(
                      distance
                    ).toFixed(1)}{" "}
                    km
                  </Text>
                </View>
              )}
          </View>

          <View
            style={
              styles.foodDetails
            }
          >
            <Text
              numberOfLines={1}
              style={[
                styles.foodName,
                {
                  color:
                    textColor,
                },
              ]}
            >
              {name}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.foodDescription,
                {
                  color:
                    mutedColor,
                },
              ]}
            >
              {item?.description ||
                "Homemade with love"}
            </Text>

            <View
              style={
                styles.foodFooter
              }
            >
              <Text
                style={
                  styles.foodPrice
                }
              >
                ₹
                {Number(
                  price || 0
                ).toFixed(0)}
              </Text>

              <View
                style={
                  styles.viewButton
                }
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={
                    COLORS.white
                  }
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    };

  // ==========================================================
  // EMPTY SECTION
  // ==========================================================

  const EmptySection =
    ({
      icon,
      title,
      text,
    }) => (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor:
              cardColor,
            borderColor:
              borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor:
                softColor,
            },
          ]}
        >
          <Ionicons
            name={
              icon ||
              "restaurant-outline"
            }
            size={25}
            color={
              COLORS.orange
            }
          />
        </View>

        <View
          style={
            styles.emptyContent
          }
        >
          <Text
            style={[
              styles.emptyTitle,
              {
                color:
                  textColor,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.emptyText,
              {
                color:
                  mutedColor,
              },
            ]}
          >
            {text}
          </Text>
        </View>
      </View>
    );

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              backgroundColor,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDarkMode
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            backgroundColor
          }
        />

        <LinearGradient
          colors={[
            COLORS.orange,
            COLORS.gold,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={
            styles.loadingLogo
          }
        >
          <Ionicons
            name="restaurant"
            size={32}
            color={
              COLORS.white
            }
          />
        </LinearGradient>

        <ActivityIndicator
          size="small"
          color={
            COLORS.orange
          }
          style={{
            marginTop: 20,
          }}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                textColor,
            },
          ]}
        >
          Finding homemade food...
        </Text>

        <Text
          style={[
            styles.loadingSubText,
            {
              color:
                mutedColor,
            },
          ]}
        >
          Checking kitchens within{" "}
          {NEARBY_RADIUS_KM} km
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // MAIN SCREEN
  // ==========================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            backgroundColor,
        },
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          backgroundColor
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
            tintColor={
              COLORS.orange
            }
            colors={[
              COLORS.orange,
            ]}
            progressBackgroundColor={
              cardColor
            }
          />
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerLeft
            }
          >
            <View
              style={
                styles.avatarContainer
              }
            >
              {getUserImage() ? (
                <Image
                  source={{
                    uri:
                      getUserImage(),
                  }}
                  style={
                    styles.avatar
                  }
                />
              ) : (
                <LinearGradient
                  colors={[
                    COLORS.orange,
                    COLORS.gold,
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={
                    styles.avatarPlaceholder
                  }
                >
                  <Ionicons
                    name="person"
                    size={22}
                    color={
                      COLORS.white
                    }
                  />
                </LinearGradient>
              )}
            </View>

            <View
              style={
                styles.greetingContainer
              }
            >
              <Text
                style={[
                  styles.greeting,
                  {
                    color:
                      mutedColor,
                  },
                ]}
              >
                {getGreeting()}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.userName,
                  {
                    color:
                      textColor,
                  },
                ]}
              >
                {getUserName()}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.headerActions
            }
          >
            {/* THEME */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.headerButton,
                {
                  backgroundColor:
                    cardColor,
                  borderColor:
                    borderColor,
                },
              ]}
              onPress={() => {
                try {
                  toggleTheme();
                } catch (error) {
                  console.log(
                    "THEME ERROR:",
                    error
                  );
                }
              }}
            >
              <Ionicons
                name={
                  isDarkMode
                    ? "sunny-outline"
                    : "moon-outline"
                }
                size={20}
                color={
                  isDarkMode
                    ? COLORS.gold
                    : COLORS.dark
                }
              />
            </TouchableOpacity>

            {/* NOTIFICATIONS */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.headerButton,
                {
                  backgroundColor:
                    cardColor,
                  borderColor:
                    borderColor,
                },
              ]}
              onPress={
                openNotifications
              }
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={
                  isDarkMode
                    ? COLORS.white
                    : COLORS.dark
                }
              />

              {unreadCount >
                0 && (
                <View
                  style={
                    styles.notificationBadge
                  }
                >
                  <Text
                    style={
                      styles.notificationText
                    }
                  >
                    {unreadCount >
                    99
                      ? "99+"
                      : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ====================================================
            LOCATION SEARCH
        ==================================================== */}

        <View
          style={[
            styles.locationSearchCard,
            {
              backgroundColor:
                cardColor,
              borderColor:
                borderColor,
            },
          ]}
        >
          <View
            style={
              styles.locationSearchTop
            }
          >
            <View
              style={
                styles.locationIcon
              }
            >
              <Ionicons
                name="location"
                size={19}
                color={
                  COLORS.orange
                }
              />
            </View>

            <View
              style={
                styles.locationSearchTitleContainer
              }
            >
              <Text
                style={[
                  styles.locationSmallTitle,
                  {
                    color:
                      mutedColor,
                  },
                ]}
              >
                DELIVER FOOD NEAR
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.selectedLocationText,
                  {
                    color:
                      textColor,
                  },
                ]}
              >
                {selectedLocation
                  ?.address ||
                  "Choose your location"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={
                getCurrentLocation
              }
              disabled={
                locationLoading
              }
              style={
                styles.gpsButton
              }
            >
              {locationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.orange
                  }
                />
              ) : (
                <Ionicons
                  name="locate-outline"
                  size={21}
                  color={
                    COLORS.orange
                  }
                />
              )}
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.locationInputRow,
              {
                backgroundColor:
                  softColor,
                borderColor:
                  borderColor,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={
                COLORS.orange
              }
            />

            <TextInput
              value={
                locationText
              }
              onChangeText={
                setLocationText
              }
              placeholder="Enter location, area or city"
              placeholderTextColor={
                mutedColor
              }
              returnKeyType="search"
              onSubmitEditing={
                searchLocation
              }
              style={[
                styles.locationInput,
                {
                  color:
                    textColor,
                },
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                searchLocation
              }
              disabled={
                locationLoading
              }
              style={
                styles.locationSearchButton
              }
            >
              {locationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.white
                  }
                />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={
                    COLORS.white
                  }
                />
              )}
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.radiusRow
            }
          >
            <Ionicons
              name="radio-outline"
              size={13}
              color={
                COLORS.orange
              }
            />

            <Text
              style={[
                styles.radiusText,
                {
                  color:
                    mutedColor,
                },
              ]}
            >
              Showing homemade food within{" "}
              <Text
                style={
                  styles.radiusStrong
                }
              >
                {NEARBY_RADIUS_KM} km
              </Text>
            </Text>
          </View>

          {locationError ? (
            <Text
              style={
                styles.locationError
              }
            >
              {locationError}
            </Text>
          ) : null}
        </View>

        {/* ====================================================
            WELCOME
        ==================================================== */}

        <View
          style={
            styles.welcomeSection
          }
        >
          <Text
            style={[
              styles.welcomeTitle,
              {
                color:
                  textColor,
              },
            ]}
          >
            What are you craving?
          </Text>

          <Text
            style={[
              styles.welcomeSubtitle,
              {
                color:
                  mutedColor,
              },
            ]}
          >
            Discover delicious homemade meals around you.
          </Text>
        </View>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={
            openSearch
          }
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                cardColor,
              borderColor:
                borderColor,
            },
          ]}
        >
          <View
            style={
              styles.searchIconContainer
            }
          >
            <Ionicons
              name="search"
              size={20}
              color={
                COLORS.orange
              }
            />
          </View>

          <Text
            style={[
              styles.searchInputFake,
              {
                color:
                  mutedColor,
              },
            ]}
          >
            Search dishes, kitchens...
          </Text>

          <View
            style={
              styles.searchFilterButton
            }
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                COLORS.white
              }
            />
          </View>
        </TouchableOpacity>

        {/* ====================================================
            RECOMMENDED HEADER
        ==================================================== */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionHeaderLeft
            }
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    textColor,
                },
              ]}
            >
              Recommended for You
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    mutedColor,
                },
              ]}
            >
              All homemade food from kitchens near you
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              openSearch
            }
          >
            <Text
              style={
                styles.seeAll
              }
            >
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* ====================================================
            RECOMMENDED FOOD
        ==================================================== */}

        {recommendedFoods.length >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.horizontalList
            }
          >
            {recommendedFoods.map(
              (
                item,
                index
              ) => (
                <HorizontalFoodCard
                  key={String(
                    item?.id ??
                      item?.food_id ??
                      index
                  )}
                  item={
                    item
                  }
                />
              )
            )}
          </ScrollView>
        ) : (
          <EmptySection
            icon="sparkles-outline"
            title="No nearby food"
            text={`No food was found from kitchens within ${NEARBY_RADIUS_KM} km of this location.`}
          />
        )}

        {/* ====================================================
            TOP RATED
        ==================================================== */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 28,
            },
          ]}
        >
          <View
            style={
              styles.sectionHeaderLeft
            }
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    textColor,
                },
              ]}
            >
              Top Rated Nearby
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color:
                    mutedColor,
                },
              ]}
            >
              All nearby food sorted by customer rating
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              openSearch
            }
          >
            <Text
              style={
                styles.seeAll
              }
            >
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* ====================================================
            TOP RATED FOOD
        ==================================================== */}

        {topRatedFoods.length >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.horizontalList
            }
          >
            {topRatedFoods.map(
              (
                item,
                index
              ) => (
                <HorizontalFoodCard
                  key={String(
                    item?.id ??
                      item?.food_id ??
                      index
                  )}
                  item={
                    item
                  }
                />
              )
            )}
          </ScrollView>
        ) : (
          <EmptySection
            icon="star-outline"
            title="No top-rated food nearby"
            text={`No food was found from kitchens within ${NEARBY_RADIUS_KM} km of this location.`}
          />
        )}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    // ========================================================
    // MAIN
    // ========================================================

    container: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 17,
      paddingBottom: 30,
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingTop: 9,
      paddingBottom: 12,
    },

    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
    },

    avatarContainer: {
      width: 49,
      height: 49,
      borderRadius: 25,
      overflow: "hidden",
      marginRight: 11,
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    avatarPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    greetingContainer: {
      flex: 1,
    },

    greeting: {
      fontSize: 11,
      fontWeight: "500",
      marginBottom: 2,
      letterSpacing: 0.2,
    },

    userName: {
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 1,
    },

    notificationBadge: {
      position: "absolute",
      right: -2,
      top: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor:
        COLORS.red,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor:
        COLORS.white,
    },

    notificationText: {
      color: COLORS.white,
      fontSize: 8,
      fontWeight: "900",
    },

    // ========================================================
    // LOCATION SEARCH
    // ========================================================

    locationSearchCard: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 12,
      marginBottom: 20,
    },

    locationSearchTop: {
      flexDirection: "row",
      alignItems: "center",
    },

    locationIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.lightOrange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    locationSearchTitleContainer: {
      flex: 1,
      marginLeft: 10,
      paddingRight: 8,
    },

    locationSmallTitle: {
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.7,
    },

    selectedLocationText: {
      fontSize: 13,
      fontWeight: "800",
      marginTop: 3,
    },

    gpsButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.lightOrange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    locationInputRow: {
      height: 52,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 13,
      paddingRight: 6,
      marginTop: 11,
    },

    locationInput: {
      flex: 1,
      height: "100%",
      fontSize: 13,
      fontWeight: "500",
      marginHorizontal: 9,
    },

    locationSearchButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor:
        COLORS.orange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    radiusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 9,
      paddingHorizontal: 3,
    },

    radiusText: {
      fontSize: 10,
      marginLeft: 5,
    },

    radiusStrong: {
      color: COLORS.orange,
      fontWeight: "900",
    },

    locationError: {
      color: COLORS.red,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 8,
      paddingHorizontal: 3,
    },

    // ========================================================
    // WELCOME
    // ========================================================

    welcomeSection: {
      marginBottom: 17,
    },

    welcomeTitle: {
      fontSize: 27,
      fontWeight: "900",
      letterSpacing: -0.8,
    },

    welcomeSubtitle: {
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },

    // ========================================================
    // SEARCH
    // ========================================================

    searchContainer: {
      height: 57,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 8,
      paddingRight: 7,
      marginBottom: 29,
      borderWidth: 1,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,
    },

    searchIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        COLORS.lightOrange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    searchInputFake: {
      flex: 1,
      marginHorizontal: 9,
      fontSize: 13,
      fontWeight: "500",
    },

    searchFilterButton: {
      width: 41,
      height: 41,
      borderRadius: 14,
      backgroundColor:
        COLORS.orange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    // ========================================================
    // SECTION
    // ========================================================

    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
      marginBottom: 14,
    },

    sectionHeaderLeft: {
      flex: 1,
      paddingRight: 10,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.3,
    },

    sectionSubtitle: {
      fontSize: 11,
      marginTop: 4,
    },

    seeAll: {
      color: COLORS.orange,
      fontSize: 12,
      fontWeight: "800",
      paddingBottom: 2,
    },

    // ========================================================
    // HORIZONTAL LIST
    // ========================================================

    horizontalList: {
      paddingRight: 5,
      paddingBottom: 4,
    },

    // ========================================================
    // FOOD CARD
    // ========================================================

    foodCard: {
      width: 190,
      borderRadius: 22,
      marginRight: 14,
      padding: 8,
      borderWidth: 1,
      overflow: "hidden",
    },

    foodImageWrapper: {
      width: "100%",
      height: 143,
      borderRadius: 17,
      overflow: "hidden",
      position: "relative",
    },

    foodImage: {
      width: "100%",
      height: "100%",
    },

    noImage: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    ratingBadge: {
      position: "absolute",
      top: 9,
      right: 9,
      minHeight: 25,
      borderRadius: 13,
      backgroundColor:
        COLORS.white,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },

    ratingText: {
      marginLeft: 3,
      fontSize: 10,
      fontWeight: "800",
      color: COLORS.dark,
    },

    distanceBadge: {
      position: "absolute",
      bottom: 9,
      left: 9,
      minHeight: 25,
      borderRadius: 13,
      backgroundColor:
        "rgba(15,14,13,0.75)",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
    },

    distanceBadgeText: {
      marginLeft: 3,
      color: COLORS.white,
      fontSize: 9,
      fontWeight: "700",
    },

    foodDetails: {
      paddingHorizontal: 3,
      paddingTop: 10,
      paddingBottom: 3,
    },

    foodName: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: -0.2,
    },

    foodDescription: {
      fontSize: 10,
      marginTop: 4,
    },

    foodFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginTop: 10,
    },

    foodPrice: {
      color: COLORS.orange,
      fontSize: 17,
      fontWeight: "900",
    },

    viewButton: {
      width: 31,
      height: 31,
      borderRadius: 16,
      backgroundColor:
        COLORS.orange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    // ========================================================
    // EMPTY
    // ========================================================

    emptyCard: {
      minHeight: 92,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 13,
    },

    emptyIcon: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent:
        "center",
    },

    emptyContent: {
      flex: 1,
      marginLeft: 12,
    },

    emptyTitle: {
      fontSize: 13,
      fontWeight: "800",
    },

    emptyText: {
      fontSize: 10,
      lineHeight: 15,
      marginTop: 3,
    },

    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 25,
    },

    loadingLogo: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 14,
      fontSize: 15,
      fontWeight: "800",
      textAlign: "center",
    },

    loadingSubText: {
      marginTop: 5,
      fontSize: 11,
      textAlign: "center",
    },

    // ========================================================
    // BOTTOM
    // ========================================================

    bottomSpace: {
      height: 35,
    },
  });

