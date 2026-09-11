import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================
// GLOBAL APP THEME
// ============================================================

import { useApp } from "./_layout";

// ============================================================
// BASE URL
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// NEARBY SEARCH RADIUS
// ============================================================
//
// Change this to 5, 10, 15, etc.
//
// 10 = 10 kilometers
//
// ============================================================

const NEARBY_RADIUS_KM = 10;

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
};

// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen() {
  // ==========================================================
  // GLOBAL THEME
  // ==========================================================

  const {
    isDarkMode,
    toggleTheme,
  } = useApp();

  // ==========================================================
  // STATE
  // ==========================================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [allFoods, setAllFoods] =
    useState([]);

  const [topRatedFoods, setTopRatedFoods] =
    useState([]);

  const [recommendedFoods, setRecommendedFoods] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [user, setUser] =
    useState(null);

  // ==========================================================
  // LOCATION STATE
  // ==========================================================

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState(null);

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(true);

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
      ? "#1A1816"
      : COLORS.white;

  const textColor =
    isDarkMode
      ? COLORS.white
      : COLORS.dark;

  const mutedColor =
    isDarkMode
      ? "#AAAAAA"
      : COLORS.muted;

  const borderColor =
    isDarkMode
      ? "#33302D"
      : COLORS.border;

  // ==========================================================
  // TOKEN
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
          const token =
            await AsyncStorage.getItem(
              key
            );

          if (
            token &&
            token.trim()
          ) {
            return token.trim();
          }
        }

        console.log(
          "HOME TOKEN: Access token not found"
        );

        return null;
      } catch (error) {
        console.log(
          "TOKEN ERROR:",
          error
        );

        return null;
      }
    }, []);

  // ==========================================================
  // USER
  // ==========================================================

  const loadUser =
    useCallback(async () => {
      try {
        const storedUser =
          await AsyncStorage.getItem(
            "user"
          );

        if (storedUser) {
          try {
            const parsedUser =
              JSON.parse(
                storedUser
              );

            if (
              parsedUser &&
              typeof parsedUser ===
                "object"
            ) {
              setUser(
                parsedUser
              );

              return;
            }
          } catch (error) {
            console.log(
              "USER PARSE ERROR:",
              error
            );
          }
        }

        const name =
          await AsyncStorage.getItem(
            "name"
          );

        const image =
          await AsyncStorage.getItem(
            "image"
          );

        const email =
          await AsyncStorage.getItem(
            "email"
          );

        setUser({
          name: name || "",
          image: image || "",
          email: email || "",
        });
      } catch (error) {
        console.log(
          "LOAD USER ERROR:",
          error
        );
      }
    }, []);

  // ==========================================================
  // HEADERS
  // ==========================================================

  const getHeaders =
    useCallback(async () => {
      const token =
        await getToken();

      return {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      };
    }, [getToken]);

  // ==========================================================
  // JSON RESPONSE
  // ==========================================================

  const parseJsonResponse =
    useCallback(
      async (response) => {
        const text =
          await response.text();

        if (!text) {
          return {};
        }

        try {
          return JSON.parse(
            text
          );
        } catch (error) {
          console.log(
            "JSON PARSE ERROR:",
            text
          );

          return {};
        }
      },
      []
    );

  // ==========================================================
  // IMAGE VALIDATION
  // ==========================================================

  const isValidImage =
    useCallback(
      (value) => {
        if (
          !value ||
          typeof value !==
            "string"
        ) {
          return false;
        }

        const trimmed =
          value.trim();

        return (
          trimmed.startsWith(
            "http://"
          ) ||
          trimmed.startsWith(
            "https://"
          )
        );
      },
      []
    );

  // ==========================================================
  // FOOD IMAGE
  // ==========================================================

  const getFoodImage =
    useCallback(
      (food) => {
        if (!food) {
          return null;
        }

        const images = [
          food.image,
          food.image_url,
          food.food_image,
          food.imageUrl,
          food.photo,
          food.photo_url,
          food.thumbnail,
          food.food_photo,
        ];

        if (
          Array.isArray(
            food.images
          )
        ) {
          images.push(
            ...food.images
          );
        }

        if (
          Array.isArray(
            food.image_urls
          )
        ) {
          images.push(
            ...food.image_urls
          );
        }

        for (const image of images) {
          if (
            isValidImage(image)
          ) {
            return image.trim();
          }
        }

        return null;
      },
      [isValidImage]
    );

  // ==========================================================
  // NORMALIZE FOOD
  // ==========================================================

  const normalizeFood =
    useCallback(
      (item) => {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return null;
        }

        const foodId =
          item.id ??
          item.food_id ??
          item.foodId ??
          item._id ??
          null;

        const foodName =
          item.name ??
          item.food_name ??
          item.foodName ??
          "Food";

        const foodDescription =
          item.description ??
          item.food_description ??
          "";

        const foodPrice =
          item.price ??
          item.food_price ??
          0;

        const foodRating =
          item.rating ??
          item.average_rating ??
          item.avg_rating ??
          0;

        return {
          ...item,

          id: foodId,

          food_id:
            item.food_id ??
            item.id ??
            item.foodId ??
            item._id ??
            null,

          name: foodName,

          food_name:
            item.food_name ??
            item.name ??
            item.foodName ??
            "Food",

          description:
            foodDescription,

          price:
            foodPrice,

          rating:
            foodRating,

          image:
            getFoodImage(item),
        };
      },
      [getFoodImage]
    );

  // ==========================================================
  // EXTRACT FOODS
  // ==========================================================

  const extractFoods =
    useCallback(
      (data) => {
        if (
          Array.isArray(data)
        ) {
          return data;
        }

        if (
          Array.isArray(
            data?.fooditems
          )
        ) {
          return data.fooditems;
        }

        if (
          Array.isArray(
            data?.foods
          )
        ) {
          return data.foods;
        }

        if (
          Array.isArray(
            data?.items
          )
        ) {
          return data.items;
        }

        if (
          Array.isArray(
            data?.data
          )
        ) {
          return data.data;
        }

        if (
          Array.isArray(
            data?.recommendations
          )
        ) {
          return data.recommendations;
        }

        return [];
      },
      []
    );

  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const getCurrentLocation =
    useCallback(async () => {
      try {
        setLocationLoading(
          true
        );

        setLocationError("");

        console.log(
          "GETTING CURRENT LOCATION..."
        );

        const servicesEnabled =
          await Location.hasServicesEnabledAsync();

        if (!servicesEnabled) {
          console.log(
            "LOCATION SERVICES DISABLED"
          );

          setLocationError(
            "Please enable location services."
          );

          setCurrentLocation(
            null
          );

          return null;
        }

        let permission =
          await Location.getForegroundPermissionsAsync();

        if (
          permission.status !==
          "granted"
        ) {
          permission =
            await Location.requestForegroundPermissionsAsync();
        }

        if (
          permission.status !==
          "granted"
        ) {
          console.log(
            "LOCATION PERMISSION DENIED"
          );

          setLocationError(
            "Location permission is required to show nearby food."
          );

          setCurrentLocation(
            null
          );

          return null;
        }

        const location =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        const latitude =
          location.coords.latitude;

        const longitude =
          location.coords.longitude;

        console.log(
          "CURRENT LATITUDE =>",
          latitude
        );

        console.log(
          "CURRENT LONGITUDE =>",
          longitude
        );

        const locationData = {
          latitude,
          longitude,
        };

        setCurrentLocation(
          locationData
        );

        return locationData;
      } catch (error) {
        console.log(
          "CURRENT LOCATION ERROR =>",
          error
        );

        setLocationError(
          "Unable to get your current location."
        );

        setCurrentLocation(
          null
        );

        return null;
      } finally {
        setLocationLoading(
          false
        );
      }
    }, []);

  // ==========================================================
  // CONVERT COORDINATE TO NUMBER
  // ==========================================================

  const toNumber =
    useCallback((value) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const number =
        Number(value);

      return Number.isFinite(
        number
      )
        ? number
        : null;
    }, []);

  // ==========================================================
  // GET LATITUDE FROM FOOD / KITCHEN
  // ==========================================================

  const getLatitude =
    useCallback(
      (food) => {
        if (!food) {
          return null;
        }

        const candidates = [
          food.latitude,
          food.lat,

          food.kitchen_latitude,
          food.kitchen_lat,

          food.kitchen?.latitude,
          food.kitchen?.lat,

          food.kitchen_data
            ?.latitude,

          food.kitchenData
            ?.latitude,

          food.location
            ?.latitude,

          food.coordinates
            ?.latitude,

          food.coordinates
            ?.lat,

          food.kitchen
            ?.location
            ?.latitude,

          food.kitchen
            ?.location
            ?.lat,

          food.kitchen
            ?.coordinates
            ?.latitude,

          food.kitchen
            ?.coordinates
            ?.lat,
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
      },
      [toNumber]
    );

  // ==========================================================
  // GET LONGITUDE FROM FOOD / KITCHEN
  // ==========================================================

  const getLongitude =
    useCallback(
      (food) => {
        if (!food) {
          return null;
        }

        const candidates = [
          food.longitude,
          food.lng,
          food.lon,

          food.kitchen_longitude,
          food.kitchen_lng,
          food.kitchen_lon,

          food.kitchen?.longitude,
          food.kitchen?.lng,
          food.kitchen?.lon,

          food.kitchen_data
            ?.longitude,

          food.kitchenData
            ?.longitude,

          food.location
            ?.longitude,

          food.location
            ?.lng,

          food.coordinates
            ?.longitude,

          food.coordinates
            ?.lng,

          food.kitchen
            ?.location
            ?.longitude,

          food.kitchen
            ?.location
            ?.lng,

          food.kitchen
            ?.coordinates
            ?.longitude,

          food.kitchen
            ?.coordinates
            ?.lng,
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
      },
      [toNumber]
    );

  // ==========================================================
  // HAVERSINE DISTANCE
  // ==========================================================
  //
  // Returns distance in KM.
  //
  // ==========================================================

  const calculateDistanceKm =
    useCallback(
      (
        lat1,
        lon1,
        lat2,
        lon2
      ) => {
        const earthRadiusKm =
          6371;

        const dLat =
          ((lat2 - lat1) *
            Math.PI) /
          180;

        const dLon =
          ((lon2 - lon1) *
            Math.PI) /
          180;

        const a =
          Math.sin(
            dLat / 2
          ) **
            2 +
          Math.cos(
            (lat1 * Math.PI) /
              180
          ) *
            Math.cos(
              (lat2 * Math.PI) /
                180
            ) *
            Math.sin(
              dLon / 2
            ) **
              2;

        const c =
          2 *
          Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
          );

        return (
          earthRadiusKm * c
        );
      },
      []
    );

  // ==========================================================
  // ADD DISTANCE TO FOOD
  // ==========================================================

  const addDistanceToFood =
    useCallback(
      (
        foods,
        location
      ) => {
        if (
          !Array.isArray(
            foods
          )
        ) {
          return [];
        }

        if (!location) {
          return [];
        }

        const {
          latitude:
            userLatitude,
          longitude:
            userLongitude,
        } = location;

        const foodsWithDistance =
          foods
            .map((food) => {
              const kitchenLatitude =
                getLatitude(
                  food
                );

              const kitchenLongitude =
                getLongitude(
                  food
                );

              // --------------------------------------------
              // Kitchen has no GPS
              // --------------------------------------------

              if (
                kitchenLatitude ===
                  null ||
                kitchenLongitude ===
                  null
              ) {
                return null;
              }

              const distance =
                calculateDistanceKm(
                  userLatitude,
                  userLongitude,
                  kitchenLatitude,
                  kitchenLongitude
                );

              return {
                ...food,

                distance_km:
                  Number(
                    distance.toFixed(
                      2
                    )
                  ),
              };
            })
            .filter(Boolean)
            .filter(
              (food) =>
                food.distance_km <=
                NEARBY_RADIUS_KM
            )
            .sort(
              (a, b) =>
                a.distance_km -
                b.distance_km
            );

        console.log(
          `NEARBY FOOD: ${foodsWithDistance.length} items within ${NEARBY_RADIUS_KM} KM`
        );

        return foodsWithDistance;
      },
      [
        getLatitude,
        getLongitude,
        calculateDistanceKm,
      ]
    );

  // ==========================================================
  // ALL FOODS
  // ==========================================================

  const fetchAllFoods =
    useCallback(
      async (
        locationOverride = null
      ) => {
        try {
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
            "ALL FOODS STATUS:",
            response.status
          );

          if (!response.ok) {
            console.log(
              "ALL FOODS API ERROR:",
              response.status
            );

            setAllFoods([]);

            return [];
          }

          const foods =
            extractFoods(data)
              .map(
                normalizeFood
              )
              .filter(Boolean);

          // --------------------------------------------------
          // FILTER BY CURRENT LOCATION
          // --------------------------------------------------

          const nearbyFoods =
            addDistanceToFood(
              foods,
              locationOverride
            );

          setAllFoods(
            nearbyFoods
          );

          return nearbyFoods;
        } catch (error) {
          console.log(
            "ALL FOODS ERROR:",
            error
          );

          setAllFoods([]);

          return [];
        }
      },
      [
        getHeaders,
        parseJsonResponse,
        extractFoods,
        normalizeFood,
        addDistanceToFood,
      ]
    );

  // ==========================================================
  // TOP RATED
  // ==========================================================

  const fetchTopRatedFoods =
    useCallback(
      async (
        locationOverride = null
      ) => {
        try {
          const headers =
            await getHeaders();

          const response =
            await fetch(
              `${BASE_URL}/api/v1/top-rated-foods`,
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
            "TOP RATED STATUS:",
            response.status
          );

          if (!response.ok) {
            setTopRatedFoods([]);

            return [];
          }

          const foods =
            extractFoods(data)
              .map(
                normalizeFood
              )
              .filter(Boolean);

          const nearbyFoods =
            addDistanceToFood(
              foods,
              locationOverride
            );

          setTopRatedFoods(
            nearbyFoods
          );

          return nearbyFoods;
        } catch (error) {
          console.log(
            "TOP RATED ERROR:",
            error
          );

          setTopRatedFoods([]);

          return [];
        }
      },
      [
        getHeaders,
        parseJsonResponse,
        extractFoods,
        normalizeFood,
        addDistanceToFood,
      ]
    );

  // ==========================================================
  // RECOMMENDED
  // ==========================================================

  const fetchRecommendedFoods =
    useCallback(
      async (
        locationOverride = null
      ) => {
        try {
          const headers =
            await getHeaders();

          const response =
            await fetch(
              `${BASE_URL}/api/v1/recommended-foods`,
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
            "RECOMMENDED STATUS:",
            response.status
          );

          if (!response.ok) {
            setRecommendedFoods(
              []
            );

            return [];
          }

          const foods =
            extractFoods(data)
              .map(
                normalizeFood
              )
              .filter(Boolean);

          const nearbyFoods =
            addDistanceToFood(
              foods,
              locationOverride
            );

          setRecommendedFoods(
            nearbyFoods
          );

          return nearbyFoods;
        } catch (error) {
          console.log(
            "RECOMMENDED ERROR:",
            error
          );

          setRecommendedFoods(
            []
          );

          return [];
        }
      },
      [
        getHeaders,
        parseJsonResponse,
        extractFoods,
        normalizeFood,
        addDistanceToFood,
      ]
    );

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
          "UNREAD COUNT ERROR:",
          error
        );

        setUnreadCount(0);
      }
    }, [
      getHeaders,
      parseJsonResponse,
    ]);

  // ==========================================================
  // LOAD HOME DATA
  // ==========================================================

  const loadHomeData =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setIsLoading(
              true
            );
          }

          // --------------------------------------------------
          // IMPORTANT:
          // Get current GPS FIRST.
          // --------------------------------------------------

          const location =
            await getCurrentLocation();

          if (!location) {
            setAllFoods([]);
            setTopRatedFoods([]);
            setRecommendedFoods(
              []
            );

            await Promise.all([
              loadUser(),
              fetchUnreadCount(),
            ]);

            return;
          }

          // --------------------------------------------------
          // Load only location-filtered food
          // --------------------------------------------------

          await Promise.all([
            loadUser(),

            fetchAllFoods(
              location
            ),

            fetchTopRatedFoods(
              location
            ),

            fetchRecommendedFoods(
              location
            ),

            fetchUnreadCount(),
          ]);
        } catch (error) {
          console.log(
            "HOME LOAD ERROR:",
            error
          );
        } finally {
          if (showLoader) {
            setIsLoading(
              false
            );
          }

          setRefreshing(false);
        }
      },
      [
        getCurrentLocation,
        loadUser,
        fetchAllFoods,
        fetchTopRatedFoods,
        fetchRecommendedFoods,
        fetchUnreadCount,
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
        await loadHomeData(
          false
        );
      } catch (error) {
        console.log(
          "REFRESH ERROR:",
          error
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      loadHomeData,
      refreshing,
    ]);

  // ==========================================================
  // GREETING
  // ==========================================================

  const getGreeting = () => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  };

  // ==========================================================
  // USER NAME
  // ==========================================================

  const getUserName = () => {
    return (
      user?.name ||
      user?.full_name ||
      user?.fullName ||
      user?.username ||
      "Food Lover"
    );
  };

  // ==========================================================
  // USER IMAGE
  // ==========================================================

  const getUserImage = () => {
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
  };

  // ==========================================================
  // OPEN DISH DETAIL
  // ==========================================================

  const openDish = (
    food
  ) => {
    if (!food) {
      return;
    }

    const normalizedFood =
      normalizeFood(food);

    if (
      normalizedFood?.id ===
        null ||
      normalizedFood?.id ===
        undefined ||
      normalizedFood?.id === ""
    ) {
      console.log(
        "FOOD ID MISSING:",
        normalizedFood
      );

      return;
    }

    router.push({
      pathname:
        "/Dish_detail_screen",

      params: {
        dish: JSON.stringify(
          normalizedFood
        ),
      },
    });
  };

  // ==========================================================
  // OPEN SEARCH
  // ==========================================================

  const openSearch = () => {
    router.push(
      "/Search_screen"
    );
  };

  // ==========================================================
  // OPEN NOTIFICATIONS
  // ==========================================================

  const openNotifications =
    () => {
      router.push(
        "/Notification_screen"
      );
    };

  // ==========================================================
  // FOOD CARD
  // ==========================================================

  const FoodCard = ({
    item,
  }) => {
    const image =
      getFoodImage(item);

    const name =
      item?.name ||
      item?.food_name ||
      "Food";

    const description =
      item?.description ||
      "Delicious homemade food";

    const price =
      item?.price ??
      item?.food_price ??
      0;

    const rating =
      item?.rating ??
      item?.average_rating ??
      item?.avg_rating ??
      0;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
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
            styles.foodImageContainer
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
              style={
                styles.noImage
              }
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
            numberOfLines={2}
            style={[
              styles.foodDescription,
              {
                color:
                  mutedColor,
              },
            ]}
          >
            {description}
          </Text>

          <View
            style={
              styles.foodBottom
            }
          >
            <View>
              <Text
                style={
                  styles.price
                }
              >
                ₹
                {Number(
                  price || 0
                ).toFixed(0)}
              </Text>

              {item?.distance_km !==
                undefined && (
                <Text
                  style={[
                    styles.distanceText,
                    {
                      color:
                        mutedColor,
                    },
                  ]}
                >
                  {item.distance_km} km away
                </Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.arrowButton
              }
              onPress={() =>
                openDish(item)
              }
            >
              <Ionicons
                name="arrow-forward"
                size={18}
                color={
                  COLORS.white
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

      return (
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.horizontalCard,
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
              styles.horizontalImageContainer
            }
          >
            {image ? (
              <Image
                source={{
                  uri: image,
                }}
                style={
                  styles.horizontalImage
                }
                resizeMode="cover"
              />
            ) : (
              <View
                style={
                  styles.horizontalNoImage
                }
              >
                <Ionicons
                  name="restaurant-outline"
                  size={34}
                  color={
                    COLORS.orange
                  }
                />
              </View>
            )}

            <View
              style={
                styles.smallRating
              }
            >
              <Ionicons
                name="star"
                size={10}
                color={
                  COLORS.gold
                }
              />

              <Text
                style={
                  styles.smallRatingText
                }
              >
                {Number(
                  rating || 0
                ).toFixed(1)}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.horizontalName,
              {
                color:
                  textColor,
              },
            ]}
          >
            {name}
          </Text>

          <Text
            style={
              styles.horizontalPrice
            }
          >
            ₹
            {Number(
              price || 0
            ).toFixed(0)}
          </Text>

          {item?.distance_km !==
            undefined && (
            <Text
              style={[
                styles.distanceText,
                {
                  color:
                    mutedColor,
                },
              ]}
            >
              {item.distance_km} km away
            </Text>
          )}
        </TouchableOpacity>
      );
    };

  // ==========================================================
  // EMPTY SECTION
  // ==========================================================

  const EmptySection =
    ({ text }) => (
      <View
        style={[
          styles.empty,
          {
            backgroundColor:
              cardColor,
            borderColor:
              borderColor,
          },
        ]}
      >
        <Ionicons
          name="restaurant-outline"
          size={30}
          color={
            mutedColor
          }
        />

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
    );

  // ==========================================================
  // LOCATION REQUIRED SCREEN
  // ==========================================================

  if (
    !isLoading &&
    !locationLoading &&
    !currentLocation
  ) {
    return (
      <SafeAreaView
        style={[
          styles.locationScreen,
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

        <View
          style={
            styles.locationCard
          }
        >
          <View
            style={
              styles.locationIcon
            }
          >
            <Ionicons
              name="location"
              size={42}
              color={
                COLORS.orange
              }
            />
          </View>

          <Text
            style={[
              styles.locationTitle,
              {
                color:
                  textColor,
              },
            ]}
          >
            Location Required
          </Text>

          <Text
            style={[
              styles.locationDescription,
              {
                color:
                  mutedColor,
              },
            ]}
          >
            We use your current location to show homemade food from kitchens near you.
          </Text>

          {locationError ? (
            <Text
              style={
                styles.locationError
              }
            >
              {locationError}
            </Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              loadHomeData(
                true
              )
            }
            style={
              styles.locationButton
            }
          >
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
                y: 0,
              }}
              style={
                styles.locationButtonGradient
              }
            >
              <Ionicons
                name="locate-outline"
                size={20}
                color={
                  COLORS.white
                }
              />

              <Text
                style={
                  styles.locationButtonText
                }
              >
                Enable Location
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // LOADING
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

        <ActivityIndicator
          size="large"
          color={
            COLORS.orange
          }
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
          Finding food near you...
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
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor:
                        isDarkMode
                          ? "#2A211B"
                          : COLORS.lightOrange,
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={23}
                    color={
                      COLORS.orange
                    }
                  />
                </View>
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

              {/* CURRENT LOCATION */}

              <View
                style={
                  styles.nearbyLabel
                }
              >
                <Ionicons
                  name="location"
                  size={11}
                  color={
                    COLORS.orange
                  }
                />

                <Text
                  style={
                    styles.nearbyLabelText
                  }
                >
                  Food within{" "}
                  {NEARBY_RADIUS_KM} km
                </Text>
              </View>
            </View>
          </View>

          <View
            style={
              styles.headerRight
            }
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.iconButton,
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
                    "TOGGLE THEME ERROR:",
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
                size={22}
                color={
                  isDarkMode
                    ? COLORS.gold
                    : COLORS.dark
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.iconButton,
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
                size={23}
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
            SEARCH
        ==================================================== */}

        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                cardColor,
              borderColor:
                borderColor,
            },
          ]}
          onPress={
            openSearch
          }
        >
          <Ionicons
            name="search-outline"
            size={22}
            color={
              mutedColor
            }
          />

          <TextInput
            value=""
            editable={false}
            pointerEvents="none"
            placeholder="Search nearby food..."
            placeholderTextColor={
              mutedColor
            }
            style={[
              styles.searchInput,
              {
                color:
                  textColor,
              },
            ]}
          />

          <Ionicons
            name="options-outline"
            size={21}
            color={
              COLORS.orange
            }
          />
        </TouchableOpacity>

        {/* ====================================================
            RECOMMENDED
        ==================================================== */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    textColor,
                },
              ]}
            >
              Recommended Near You
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
              Handpicked dishes from nearby kitchens
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
                  item={item}
                />
              )
            )}
          </ScrollView>
        ) : (
          <EmptySection
            text={`No recommended food within ${NEARBY_RADIUS_KM} km`}
          />
        )}

        {/* ====================================================
            TOP RATED
        ==================================================== */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 10,
            },
          ]}
        >
          <View>
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
              Loved by customers near you
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
                  item={item}
                />
              )
            )}
          </ScrollView>
        ) : (
          <EmptySection
            text={`No top rated food within ${NEARBY_RADIUS_KM} km`}
          />
        )}

        {/* ====================================================
            ALL NEARBY FOOD
        ==================================================== */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 10,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    textColor,
                },
              ]}
            >
              Nearby Food
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
              Homemade food from kitchens near you
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
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {allFoods.length >
        0 ? (
          <View
            style={
              styles.foodGrid
            }
          >
            {allFoods.map(
              (
                item,
                index
              ) => (
                <FoodCard
                  key={String(
                    item?.id ??
                      item?.food_id ??
                      index
                  )}
                  item={item}
                />
              )
            )}
          </View>
        ) : (
          <EmptySection
            text={`No food found within ${NEARBY_RADIUS_KM} km of your location`}
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

// ================================================================
// STYLES
// ================================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },

    // ==========================================================
    // LOCATION SCREEN
    // ==========================================================

    locationScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 25,
    },

    locationCard: {
      width: "100%",
      alignItems: "center",
      padding: 30,
      borderRadius: 25,
      backgroundColor:
        COLORS.white,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.1,
      shadowRadius: 15,
    },

    locationIcon: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      backgroundColor:
        COLORS.lightOrange,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 20,
    },

    locationTitle: {
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },

    locationDescription: {
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      marginTop: 10,
    },

    locationError: {
      color: COLORS.red,
      fontSize: 12,
      textAlign: "center",
      marginTop: 12,
    },

    locationButton: {
      width: "100%",
      height: 54,
      borderRadius: 17,
      overflow: "hidden",
      marginTop: 22,
    },

    locationButtonGradient: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    locationButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "700",
    },

    // ==========================================================
    // HEADER
    // ==========================================================

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingTop: 8,
      paddingBottom: 10,
    },

    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
      fontSize: 12,
      marginBottom: 2,
    },

    userName: {
      fontSize: 17,
      fontWeight: "700",
    },

    nearbyLabel: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },

    nearbyLabelText: {
      marginLeft: 3,
      color: COLORS.orange,
      fontSize: 10,
      fontWeight: "600",
    },

    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    iconButton: {
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
    },

    notificationText: {
      color: COLORS.white,
      fontSize: 9,
      fontWeight: "800",
    },

    // ==========================================================
    // SEARCH
    // ==========================================================

    searchContainer: {
      height: 52,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      marginBottom: 26,
      borderWidth: 1,
    },

    searchInput: {
      flex: 1,
      height: "100%",
      marginHorizontal: 10,
      fontSize: 14,
    },

    // ==========================================================
    // SECTION
    // ==========================================================

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 13,
      marginTop: 4,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 12,
    },

    seeAll: {
      color: COLORS.orange,
      fontSize: 13,
      fontWeight: "700",
    },

    // ==========================================================
    // HORIZONTAL FOOD
    // ==========================================================

    horizontalList: {
      paddingBottom: 7,
      paddingRight: 5,
    },

    horizontalCard: {
      width: 155,
      borderRadius: 18,
      padding: 9,
      marginRight: 13,
      borderWidth: 1,
    },

    horizontalImageContainer: {
      width: "100%",
      height: 120,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
    },

    horizontalImage: {
      width: "100%",
      height: "100%",
    },

    horizontalNoImage: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.lightOrange,
    },

    smallRating: {
      position: "absolute",
      top: 7,
      right: 7,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        COLORS.white,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },

    smallRatingText: {
      marginLeft: 3,
      fontSize: 9,
      fontWeight: "700",
      color: COLORS.dark,
    },

    horizontalName: {
      marginTop: 9,
      fontSize: 14,
      fontWeight: "700",
    },

    horizontalPrice: {
      marginTop: 5,
      color: COLORS.orange,
      fontSize: 15,
      fontWeight: "800",
    },

    // ==========================================================
    // FOOD GRID
    // ==========================================================

    foodGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
    },

    foodCard: {
      width: "48.3%",
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 15,
      borderWidth: 1,
    },

    foodImageContainer: {
      width: "100%",
      height: 145,
      position: "relative",
    },

    foodImage: {
      width: "100%",
      height: "100%",
    },

    noImage: {
      flex: 1,
      backgroundColor:
        COLORS.lightOrange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    ratingBadge: {
      position: "absolute",
      right: 8,
      top: 8,
      backgroundColor:
        COLORS.white,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    ratingText: {
      marginLeft: 3,
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.dark,
    },

    foodDetails: {
      padding: 10,
    },

    foodName: {
      fontSize: 15,
      fontWeight: "800",
    },

    foodDescription: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
      minHeight: 32,
    },

    foodBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginTop: 9,
    },

    price: {
      fontSize: 16,
      fontWeight: "800",
      color: COLORS.orange,
    },

    distanceText: {
      marginTop: 2,
      fontSize: 9,
      fontWeight: "500",
    },

    arrowButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        COLORS.orange,
      alignItems: "center",
      justifyContent:
        "center",
    },

    // ==========================================================
    // EMPTY
    // ==========================================================

    empty: {
      minHeight: 100,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 22,
      paddingHorizontal: 20,
    },

    emptyText: {
      marginTop: 7,
      fontSize: 12,
      textAlign: "center",
    },

    // ==========================================================
    // LOADING
    // ==========================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: "600",
    },

    // ==========================================================
    // BOTTOM
    // ==========================================================

    bottomSpace: {
      height: 30,
    },
  });

