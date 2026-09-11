import {
  useCallback,
  useEffect,
  useState,
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
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  // THEME COLORS
  // ==========================================================

  const backgroundColor = isDarkMode
    ? COLORS.dark
    : COLORS.background;

  const cardColor = isDarkMode
    ? "#1A1816"
    : COLORS.white;

  const textColor = isDarkMode
    ? COLORS.white
    : COLORS.dark;

  const mutedColor = isDarkMode
    ? "#AAAAAA"
    : COLORS.muted;

  const borderColor = isDarkMode
    ? "#33302D"
    : COLORS.border;

  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = useCallback(async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "access_token"
        );

      if (
        !token ||
        !token.trim()
      ) {
        console.log(
          "HOME TOKEN: Access token not found"
        );

        return null;
      }

      return token;
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

  const loadUser = useCallback(async () => {
    try {
      const storedUser =
        await AsyncStorage.getItem(
          "user"
        );

      // ------------------------------------------------------
      // Stored complete user object
      // ------------------------------------------------------

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          if (
            parsedUser &&
            typeof parsedUser === "object"
          ) {
            setUser(parsedUser);

            return;
          }
        } catch (error) {
          console.log(
            "USER PARSE ERROR:",
            error
          );
        }
      }

      // ------------------------------------------------------
      // Individual stored values
      // ------------------------------------------------------

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

  const getHeaders = useCallback(
    async () => {
      const token =
        await getToken();

      return {
        Accept: "application/json",

        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      };
    },
    [getToken]
  );

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
          return JSON.parse(text);
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

  const isValidImage = useCallback(
    (value) => {
      if (
        !value ||
        typeof value !== "string"
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

  const getFoodImage = useCallback(
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
      ];

      // ------------------------------------------------------
      // images[]
      // ------------------------------------------------------

      if (
        Array.isArray(
          food.images
        )
      ) {
        images.push(
          ...food.images
        );
      }

      // ------------------------------------------------------
      // image_urls[]
      // ------------------------------------------------------

      if (
        Array.isArray(
          food.image_urls
        )
      ) {
        images.push(
          ...food.image_urls
        );
      }

      // ------------------------------------------------------
      // Find first valid URL
      // ------------------------------------------------------

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
          typeof item !== "object"
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

          price: foodPrice,

          rating: foodRating,

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
    useCallback((data) => {
      // Direct array
      if (
        Array.isArray(data)
      ) {
        return data;
      }

      // fooditems
      if (
        Array.isArray(
          data?.fooditems
        )
      ) {
        return data.fooditems;
      }

      // foods
      if (
        Array.isArray(
          data?.foods
        )
      ) {
        return data.foods;
      }

      // items
      if (
        Array.isArray(
          data?.items
        )
      ) {
        return data.items;
      }

      // data
      if (
        Array.isArray(
          data?.data
        )
      ) {
        return data.data;
      }

      // recommendations
      if (
        Array.isArray(
          data?.recommendations
        )
      ) {
        return data.recommendations;
      }

      return [];
    }, []);

  // ==========================================================
  // ALL FOODS
  // ==========================================================

  const fetchAllFoods =
    useCallback(async () => {
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

        console.log(
          "ALL FOODS:",
          data
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
            .map(normalizeFood)
            .filter(Boolean);

        setAllFoods(foods);

        return foods;
      } catch (error) {
        console.log(
          "ALL FOODS ERROR:",
          error
        );

        setAllFoods([]);

        return [];
      }
    }, [
      getHeaders,
      parseJsonResponse,
      extractFoods,
      normalizeFood,
    ]);

  // ==========================================================
  // TOP RATED
  // ==========================================================

  const fetchTopRatedFoods =
    useCallback(async () => {
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

        console.log(
          "TOP RATED:",
          data
        );

        if (!response.ok) {
          console.log(
            "TOP RATED API ERROR:",
            response.status
          );

          setTopRatedFoods([]);

          return [];
        }

        const foods =
          extractFoods(data)
            .map(normalizeFood)
            .filter(Boolean);

        setTopRatedFoods(foods);

        return foods;
      } catch (error) {
        console.log(
          "TOP RATED ERROR:",
          error
        );

        setTopRatedFoods([]);

        return [];
      }
    }, [
      getHeaders,
      parseJsonResponse,
      extractFoods,
      normalizeFood,
    ]);

  // ==========================================================
  // RECOMMENDED
  // ==========================================================

  const fetchRecommendedFoods =
    useCallback(async () => {
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

        console.log(
          "RECOMMENDED:",
          data
        );

        if (!response.ok) {
          console.log(
            "RECOMMENDED API ERROR:",
            response.status
          );

          setRecommendedFoods([]);

          return [];
        }

        const foods =
          extractFoods(data)
            .map(normalizeFood)
            .filter(Boolean);

        setRecommendedFoods(
          foods
        );

        return foods;
      } catch (error) {
        console.log(
          "RECOMMENDED ERROR:",
          error
        );

        setRecommendedFoods([]);

        return [];
      }
    }, [
      getHeaders,
      parseJsonResponse,
      extractFoods,
      normalizeFood,
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

        console.log(
          "UNREAD COUNT STATUS:",
          response.status
        );

        console.log(
          "UNREAD COUNT:",
          data
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
      async (showLoader = true) => {
        try {
          if (showLoader) {
            setIsLoading(true);
          }

          await Promise.all([
            loadUser(),
            fetchAllFoods(),
            fetchTopRatedFoods(),
            fetchRecommendedFoods(),
            fetchUnreadCount(),
          ]);
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
    let mounted = true;

    const load = async () => {
      if (!mounted) {
        return;
      }

      await loadHomeData(true);
    };

    load();

    return () => {
      mounted = false;
    };
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
        await loadHomeData(false);
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

    return isValidImage(image)
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
      console.log(
        "FOOD DATA MISSING"
      );

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

    console.log(
      "OPENING DISH:",
      normalizedFood
    );

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

  const openNotifications = () => {
    // IMPORTANT:
    // Your route file is Notification_screen.jsx
    // NOT Notifications_screen.jsx

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
        {/* ==================================================
            IMAGE
        ================================================== */}

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

          {/* Rating */}

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

        {/* ==================================================
            DETAILS
        ================================================== */}

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
          {/* IMAGE */}

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

            {/* Rating */}

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

          {/* NAME */}

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

          {/* PRICE */}

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
          color={mutedColor}
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
          Loading delicious food...
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
          {/* LEFT */}

          <View
            style={
              styles.headerLeft
            }
          >
            {/* AVATAR */}

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

            {/* GREETING */}

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

          {/* RIGHT */}

          <View
            style={
              styles.headerRight
            }
          >
            {/* THEME */}

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
              accessibilityRole="button"
              accessibilityLabel={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
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

            {/* NOTIFICATIONS */}

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
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
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
            placeholder="Search for food..."
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
              Recommended For You
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
              Handpicked dishes for you
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
            text="No recommended food available"
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
              Top Rated
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
              Loved by our customers
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
            text="No top rated food available"
          />
        )}

        {/* ====================================================
            ALL FOOD
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
              All Food
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
              Explore homemade dishes
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
            text="No food available"
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
    },

    emptyText: {
      marginTop: 7,
      fontSize: 12,
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

