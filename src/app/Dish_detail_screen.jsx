import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://api.homecookt.com";

const COLORS = {
  orange: "#F97316",
  gold: "#FBBF24",
  background: "#FEF8F3",
  dark: "#0F0E0D",
  white: "#FFFFFF",
  muted: "#777777",
  lightMuted: "#999999",
  border: "#EEEEEE",
  lightOrange: "#FFF1E7",
  green: "#16A34A",
  red: "#EF4444",
  star: "#FBBF24",
};

const SHOW_DELETE_BUTTON = false;

export default function DishDetailScreen() {
  // ============================================================
  // EXPO ROUTER PARAMS
  // ============================================================

  const params = useLocalSearchParams();

  const rawDish = Array.isArray(params?.dish)
    ? params.dish[0]
    : params?.dish;

  const [dish, setDish] = useState(() => {
    try {
      return rawDish ? JSON.parse(rawDish) : {};
    } catch (error) {
      console.log("INITIAL DISH PARSE ERROR =>", error);
      return {};
    }
  });

  // ============================================================
  // STATE
  // ============================================================

  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const [isFavorite, setIsFavorite] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [addingToCart, setAddingToCart] = useState(false);

  const [foodItems, setFoodItems] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // DISH ID
  // ============================================================

  const dishId = useMemo(() => {
    if (!dish) return null;

    return (
      dish.id ??
      dish.food_id ??
      dish.foodId ??
      null
    );
  }, [dish]);

  // ============================================================
  // NORMALIZE FOOD
  // ============================================================

  const normalizeFood = useCallback((item) => {
    if (!item) return null;

    const image =
      item.image ??
      item.image_url ??
      item.imageUrl ??
      item.food_image ??
      item.food_image_url ??
      item.image_urls?.[0] ??
      item.images?.[0] ??
      null;

    return {
      ...item,

      id:
        item.id ??
        item.food_id ??
        item.foodId ??
        null,

      name:
        item.name ??
        item.food_name ??
        item.foodName ??
        "Food Item",

      description:
        item.description ??
        item.food_description ??
        "",

      price:
        Number(
          item.price ??
          item.food_price ??
          0
        ) || 0,

      rating:
        Number(
          item.rating ??
          item.average_rating ??
          item.avg_rating ??
          0
        ) || 0,

      image,
    };
  }, []);

  // ============================================================
  // LOAD TOKEN
  // ============================================================

  const loadToken = useCallback(async () => {
    try {
      const storedToken =
        await AsyncStorage.getItem("access_token");

      if (storedToken) {
        setToken(storedToken);
      }

      return storedToken || "";
    } catch (error) {
      console.log("TOKEN LOAD ERROR =>", error);
      return "";
    }
  }, []);

  // ============================================================
  // FAVORITE
  // ============================================================

  const loadFavorite = useCallback(async () => {
    if (!dishId) return;

    try {
      const stored =
        await AsyncStorage.getItem("favorite_foods");

      if (!stored) {
        setIsFavorite(false);
        return;
      }

      const favorites = JSON.parse(stored);

      if (!Array.isArray(favorites)) {
        setIsFavorite(false);
        return;
      }

      setIsFavorite(
        favorites.some(
          (item) => String(item) === String(dishId)
        )
      );
    } catch (error) {
      console.log("FAVORITE LOAD ERROR =>", error);
    }
  }, [dishId]);

  const toggleFavorite = async () => {
    if (!dishId) return;

    try {
      const stored =
        await AsyncStorage.getItem("favorite_foods");

      let favorites = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            favorites = parsed;
          }
        } catch {
          favorites = [];
        }
      }

      const exists = favorites.some(
        (item) => String(item) === String(dishId)
      );

      if (exists) {
        favorites = favorites.filter(
          (item) => String(item) !== String(dishId)
        );
        setIsFavorite(false);
      } else {
        favorites.push(dishId);
        setIsFavorite(true);
      }

      await AsyncStorage.setItem(
        "favorite_foods",
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.log("FAVORITE ERROR =>", error);

      Alert.alert(
        "Error",
        "Unable to update favorite."
      );
    }
  };

  // ============================================================
  // FETCH FOOD DETAIL
  // ============================================================

  const fetchFoodDetail = useCallback(async () => {
    if (!dishId) {
      setLoading(false);
      setErrorMessage("Food details are unavailable.");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/food/${dishId}`
      );

      const text = await response.text();

      let decoded = {};

      try {
        decoded = text ? JSON.parse(text) : {};
      } catch {
        decoded = {};
      }

      if (!response.ok) {
        console.log(
          "FOOD DETAIL ERROR:",
          response.status,
          decoded
        );

        throw new Error(
          decoded?.detail ||
          decoded?.message ||
          "Unable to load food details."
        );
      }

      const serverFood =
        decoded?.data ??
        decoded?.food ??
        decoded?.item ??
        decoded;

      const normalized = normalizeFood(serverFood);

      if (normalized?.id) {
        setDish((previous) => ({
          ...previous,
          ...normalized,
        }));
      }
    } catch (error) {
      console.log("FETCH FOOD DETAIL ERROR =>", error);
      setErrorMessage(
        error?.message ||
        "Unable to load food details."
      );
    }
  }, [dishId, normalizeFood]);

  // ============================================================
  // FETCH REVIEWS
  // ============================================================

  const fetchReviews = useCallback(async () => {
    if (!dishId) return;

    setReviewsLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/food-reviews/${dishId}`
      );

      const text = await response.text();

      let decoded = {};

      try {
        decoded = text ? JSON.parse(text) : {};
      } catch {
        decoded = {};
      }

      if (!response.ok) {
        console.log(
          "REVIEWS ERROR:",
          response.status,
          decoded
        );

        throw new Error(
          decoded?.detail ||
          decoded?.message ||
          "Unable to load reviews."
        );
      }

      const reviewData =
        decoded?.data ??
        decoded?.reviews ??
        decoded?.items ??
        decoded;

      setReviews(
        Array.isArray(reviewData)
          ? reviewData
          : []
      );
    } catch (error) {
      console.log("FETCH REVIEWS ERROR =>", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [dishId]);

  // ============================================================
  // FETCH FOOD ITEMS
  // ============================================================

  const getFoodItems = useCallback(async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/get/fooditems`
      );

      const text = await response.text();

      let decoded = {};

      try {
        decoded = text ? JSON.parse(text) : {};
      } catch {
        decoded = {};
      }

      if (!response.ok) {
        return;
      }

      const data =
        decoded?.data ??
        decoded?.fooditems ??
        decoded?.foods ??
        [];

      setFoodItems(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.log("FOOD ITEMS ERROR =>", error);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    console.log("DISH RECEIVED =>", dish);

    loadToken();
    loadFavorite();

    fetchFoodDetail();
    fetchReviews();
    getFoodItems();
  }, [
    loadToken,
    loadFavorite,
    fetchFoodDetail,
    fetchReviews,
    getFoodItems,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const refreshPage = async () => {
    setRefreshing(true);
    setErrorMessage("");

    try {
      await Promise.all([
        fetchFoodDetail(),
        fetchReviews(),
        loadFavorite(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // QUANTITY
  // ============================================================

  const increaseQuantity = () => {
    setQuantity((previous) => previous + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((previous) =>
      previous > 1 ? previous - 1 : 1
    );
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const addToCartRequest = async (
    replaceCart = false
  ) => {
    if (!dishId) {
      Alert.alert(
        "Error",
        "Food ID is missing."
      );
      return null;
    }

    const currentToken =
      token ||
      (await AsyncStorage.getItem("access_token"));

    if (!currentToken) {
      Alert.alert(
        "Login Required",
        "Please login to add food to your cart."
      );
      return null;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/cart/add`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },

          body: JSON.stringify({
            food_id: dishId,
            quantity,
            replace_cart: replaceCart,
          }),
        }
      );

      const text = await response.text();

      let decoded = {};

      try {
        decoded = text ? JSON.parse(text) : {};
      } catch {
        decoded = {};
      }

      console.log(
        "ADD TO CART STATUS =>",
        response.status
      );

      console.log(
        "ADD TO CART RESPONSE =>",
        decoded
      );

      return {
        ok: response.ok,
        status: response.status,
        data: decoded,
      };
    } catch (error) {
      console.log(
        "ADD TO CART REQUEST ERROR =>",
        error
      );

      return {
        ok: false,
        status: 0,
        data: {},
        error,
      };
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;

    setAddingToCart(true);

    try {
      const result = await addToCartRequest(false);

      if (!result) return;

      // ==========================================================
      // SUCCESS → GO DIRECTLY TO CART SCREEN
      // ==========================================================
      if (result.ok) {
        router.replace("/Cart_screen");
        return;
      }

      // ==========================================================
      // ANOTHER KITCHEN → ASK TO REPLACE CART
      // ==========================================================
      const replaceRequired =
        result?.data?.replace_required === true ||
        result?.data?.replaceRequired === true;

      if (replaceRequired) {
        Alert.alert(
          "Replace Cart?",
          "Your cart contains food from another kitchen. Do you want to replace it?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Replace",
              style: "destructive",
              onPress: async () => {
                setAddingToCart(true);

                try {
                  const replaceResult =
                    await addToCartRequest(true);

                  if (replaceResult?.ok) {
                    // After replacing the cart successfully,
                    // go directly to Cart screen.
                    router.replace("/Cart_screen");
                  } else {
                    Alert.alert(
                      "Unable to Add",
                      replaceResult?.data?.detail ||
                      replaceResult?.data?.message ||
                      "Unable to add this food to your cart."
                    );
                  }
                } catch (error) {
                  console.log(
                    "REPLACE CART ERROR =>",
                    error
                  );

                  Alert.alert(
                    "Unable to Add",
                    error?.message ||
                    "Unable to add this food to your cart."
                  );
                } finally {
                  setAddingToCart(false);
                }
              },
            },
          ]
        );

        return;
      }

      // ==========================================================
      // OTHER API ERROR
      // ==========================================================
      Alert.alert(
        "Unable to Add",
        result?.data?.detail ||
        result?.data?.message ||
        "Unable to add this food to your cart."
      );
    } catch (error) {
      console.log(
        "HANDLE ADD TO CART ERROR =>",
        error
      );

      Alert.alert(
        "Unable to Add",
        error?.message ||
        "Something went wrong while adding the food to your cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // ============================================================
  // SUBMIT REVIEW
  // ============================================================

  const submitReview = async () => {
    if (submittingReview) return;

    if (!dishId) {
      Alert.alert(
        "Error",
        "Food ID is missing."
      );
      return;
    }

    if (!reviewComment.trim()) {
      Alert.alert(
        "Review Required",
        "Please write a review before submitting."
      );
      return;
    }

    const currentToken =
      token ||
      (await AsyncStorage.getItem("access_token"));

    if (!currentToken) {
      Alert.alert(
        "Login Required",
        "Please login to submit a review."
      );
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/food-review/${dishId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },

          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment.trim(),
          }),
        }
      );

      const text = await response.text();

      let decoded = {};

      try {
        decoded = text ? JSON.parse(text) : {};
      } catch {
        decoded = {};
      }

      console.log(
        "REVIEW STATUS =>",
        response.status
      );

      console.log(
        "REVIEW RESPONSE =>",
        decoded
      );

      if (!response.ok) {
        throw new Error(
          decoded?.detail ||
          decoded?.message ||
          "Unable to submit review."
        );
      }

      setReviewComment("");
      setReviewRating(5);

      Alert.alert(
        "Review Submitted",
        "Thank you for your review."
      );

      await fetchReviews();
    } catch (error) {
      console.log(
        "SUBMIT REVIEW ERROR =>",
        error
      );

      Alert.alert(
        "Unable to Submit",
        error?.message ||
        "Something went wrong while submitting your review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // ============================================================
  // DELETE FOOD
  // CUSTOMER SCREEN - DISABLED
  // ============================================================

  const deleteFood = async () => {
    if (!SHOW_DELETE_BUTTON) return;

    Alert.alert(
      "Delete Food",
      "Are you sure you want to delete this food?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentToken =
                token ||
                (await AsyncStorage.getItem(
                  "access_token"
                ));

              const response = await fetch(
                `${BASE_URL}/api/v1/food/${dishId}`,
                {
                  method: "DELETE",

                  headers: {
                    Authorization: `Bearer ${currentToken}`,
                  },
                }
              );

              if (!response.ok) {
                throw new Error(
                  "Unable to delete food."
                );
              }

              Alert.alert(
                "Deleted",
                "Food has been deleted."
              );

              router.back();
            } catch (error) {
              console.log(
                "DELETE FOOD ERROR =>",
                error
              );

              Alert.alert(
                "Error",
                error?.message ||
                "Unable to delete food."
              );
            }
          },
        },
      ]
    );
  };

  // ============================================================
  // VALUES
  // ============================================================

  const foodName =
    dish?.name ||
    dish?.food_name ||
    "Food Item";

  const foodDescription =
    dish?.description ||
    dish?.food_description ||
    "Freshly prepared homemade food.";

  const foodPrice =
    Number(
      dish?.price ??
      dish?.food_price ??
      0
    ) || 0;

  const rating =
    Number(
      dish?.rating ??
      dish?.average_rating ??
      dish?.avg_rating ??
      0
    ) || 0;

  const ratingCount =
    Number(
      dish?.rating_count ??
      dish?.review_count ??
      dish?.reviews_count ??
      reviews.length
    ) || 0;

  const category =
    dish?.category ||
    dish?.food_category ||
    "Homemade";

  const preparationTime =
    dish?.preparation_time ??
    dish?.preparationTime ??
    dish?.prep_time ??
    null;

  const servingSize =
    dish?.serving_size ??
    dish?.servingSize ??
    null;

  const availableQuantity =
    dish?.available_quantity ??
    dish?.availableQuantity ??
    null;

  const totalPrice =
    foodPrice * quantity;

  const heroImage =
    dish?.image ??
    dish?.image_url ??
    dish?.imageUrl ??
    dish?.food_image ??
    dish?.food_image_url ??
    dish?.image_urls?.[0] ??
    dish?.images?.[0] ??
    null;

  // ============================================================
  // REVIEW HELPERS
  // ============================================================

  const getReviewRating = (review) => {
    return Number(
      review?.rating ??
      review?.stars ??
      0
    ) || 0;
  };

  const getReviewComment = (review) => {
    return (
      review?.comment ??
      review?.review ??
      review?.review_text ??
      review?.description ??
      ""
    );
  };

  const getReviewName = (review) => {
    return (
      review?.user_name ??
      review?.username ??
      review?.name ??
      review?.user?.name ??
      "Customer"
    );
  };

  const getReviewImage = (review) => {
    return (
      review?.user_image ??
      review?.profile_image ??
      review?.avatar ??
      review?.image ??
      review?.user?.image ??
      null
    );
  };

  // ============================================================
  // STAR COMPONENT
  // ============================================================

  const Stars = ({
    value = 0,
    size = 18,
    interactive = false,
    onSelect,
  }) => {
    const roundedValue = Math.round(
      Number(value) || 0
    );

    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
            onPress={() =>
              interactive &&
              onSelect &&
              onSelect(star)
            }
            style={
              interactive
                ? styles.interactiveStar
                : undefined
            }
          >
            <Ionicons
              name={
                star <= roundedValue
                  ? "star"
                  : "star-outline"
              }
              size={size}
              color={COLORS.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ============================================================
  // BACK BUTTON
  // ============================================================

  const handleBack = () => {
    router.back();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading && !dishId) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <ActivityIndicator
          size="large"
          color={COLORS.orange}
        />

        <Text style={styles.loadingText}>
          Loading food details...
        </Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.dark}
            />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            Food Details
          </Text>

          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.75}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={
                isFavorite
                  ? "heart"
                  : "heart-outline"
              }
              size={25}
              color={
                isFavorite
                  ? COLORS.red
                  : COLORS.dark
              }
            />
          </TouchableOpacity>
        </View>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshPage}
              tintColor={COLORS.orange}
            />
          }
        >
          {/* ====================================================
              HERO IMAGE
          ==================================================== */}

          <View style={styles.heroContainer}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="restaurant-outline"
                  size={65}
                  color={COLORS.orange}
                />

                <Text
                  style={
                    styles.imagePlaceholderText
                  }
                >
                  Food Image
                </Text>
              </View>
            )}

            {category ? (
              <View style={styles.categoryBadge}>
                <Text
                  style={styles.categoryBadgeText}
                >
                  {category}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.favoriteFloating}
              activeOpacity={0.8}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={
                  isFavorite
                    ? "heart"
                    : "heart-outline"
                }
                size={24}
                color={
                  isFavorite
                    ? COLORS.red
                    : COLORS.dark
                }
              />
            </TouchableOpacity>
          </View>

          {/* ====================================================
              BASIC INFORMATION
          ==================================================== */}

          <View style={styles.infoCard}>
            <Text style={styles.foodName}>
              {foodName}
            </Text>

            <View style={styles.ratingLine}>
              <Stars
                value={rating}
                size={18}
              />

              <Text style={styles.ratingText}>
                {rating > 0
                  ? rating.toFixed(1)
                  : "New"}
              </Text>

              {ratingCount > 0 ? (
                <Text style={styles.reviewCount}>
                  ({ratingCount} reviews)
                </Text>
              ) : null}
            </View>

            <Text style={styles.description}>
              {foodDescription}
            </Text>

            {/* ==================================================
                FOOD STATS
            ================================================== */}

            <View style={styles.statsContainer}>
              {preparationTime !== null &&
                preparationTime !== undefined &&
                preparationTime !== "" ? (
                <View style={styles.statItem}>
                  <View
                    style={styles.statIcon}
                  >
                    <Ionicons
                      name="time-outline"
                      size={21}
                      color={COLORS.orange}
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.statLabel}
                    >
                      Preparation
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {String(
                        preparationTime
                      ).includes("min")
                        ? preparationTime
                        : `${preparationTime} min`}
                    </Text>
                  </View>
                </View>
              ) : null}

              {servingSize ? (
                <View style={styles.statItem}>
                  <View
                    style={styles.statIcon}
                  >
                    <Ionicons
                      name="people-outline"
                      size={21}
                      color={COLORS.orange}
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.statLabel}
                    >
                      Serving
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {servingSize}
                    </Text>
                  </View>
                </View>
              ) : null}

              {availableQuantity !== null &&
                availableQuantity !==
                undefined &&
                availableQuantity !== "" ? (
                <View style={styles.statItem}>
                  <View
                    style={styles.statIcon}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={21}
                      color={COLORS.orange}
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.statLabel}
                    >
                      Available
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {availableQuantity}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* ====================================================
              ERROR
          ==================================================== */}

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={COLORS.red}
              />

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* ====================================================
              QUANTITY + PRICE
          ==================================================== */}

          <View style={styles.orderCard}>
            <View>
              <Text style={styles.priceLabel}>
                Price
              </Text>

              <Text style={styles.price}>
                ₹{foodPrice.toFixed(0)}
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.priceLabel,
                  { textAlign: "right" },
                ]}
              >
                Quantity
              </Text>

              <View style={styles.quantityBox}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  activeOpacity={0.7}
                  onPress={decreaseQuantity}
                >
                  <Ionicons
                    name="remove"
                    size={19}
                    color={COLORS.dark}
                  />
                </TouchableOpacity>

                <Text
                  style={styles.quantityText}
                >
                  {quantity}
                </Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  activeOpacity={0.7}
                  onPress={increaseQuantity}
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color={COLORS.dark}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ====================================================
              REVIEWS
          ==================================================== */}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Customer Reviews
              </Text>

              {reviews.length > 0 ? (
                <Text
                  style={styles.sectionCount}
                >
                  {reviews.length}
                </Text>
              ) : null}
            </View>

            {/* REVIEW FORM */}

            <View style={styles.reviewForm}>
              <Text style={styles.formTitle}>
                Write a Review
              </Text>

              <Text
                style={styles.ratingQuestion}
              >
                Your rating
              </Text>

              <Stars
                value={reviewRating}
                size={28}
                interactive
                onSelect={setReviewRating}
              />

              <TextInput
                style={styles.reviewInput}
                value={reviewComment}
                onChangeText={
                  setReviewComment
                }
                placeholder="Share your experience..."
                placeholderTextColor={
                  COLORS.lightMuted
                }
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />

              <TouchableOpacity
                style={[
                  styles.submitReviewButton,
                  submittingReview &&
                  styles.disabledButton,
                ]}
                activeOpacity={0.8}
                disabled={submittingReview}
                onPress={submitReview}
              >
                {submittingReview ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={18}
                      color={COLORS.white}
                    />

                    <Text
                      style={
                        styles.submitReviewText
                      }
                    >
                      Submit Review
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* REVIEWS */}

            {reviewsLoading ? (
              <View
                style={styles.reviewsLoading}
              >
                <ActivityIndicator
                  size="small"
                  color={COLORS.orange}
                />

                <Text
                  style={
                    styles.reviewsLoadingText
                  }
                >
                  Loading reviews...
                </Text>
              </View>
            ) : reviews.length === 0 ? (
              <View
                style={styles.noReviews}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={36}
                  color={COLORS.lightMuted}
                />

                <Text
                  style={styles.noReviewsTitle}
                >
                  No reviews yet
                </Text>

                <Text
                  style={styles.noReviewsText}
                >
                  Be the first to review this
                  food.
                </Text>
              </View>
            ) : (
              reviews.map((review, index) => {
                const reviewImage =
                  getReviewImage(review);

                const reviewRatingValue =
                  getReviewRating(review);

                const reviewName =
                  getReviewName(review);

                const reviewComment =
                  getReviewComment(review);

                return (
                  <View
                    key={
                      review?.review_id ??
                      review?.id ??
                      index
                    }
                    style={styles.reviewCard}
                  >
                    <View
                      style={
                        styles.reviewTopRow
                      }
                    >
                      {reviewImage ? (
                        <Image
                          source={{
                            uri: reviewImage,
                          }}
                          style={
                            styles.reviewAvatar
                          }
                        />
                      ) : (
                        <View
                          style={
                            styles.reviewAvatarPlaceholder
                          }
                        >
                          <Ionicons
                            name="person"
                            size={19}
                            color={
                              COLORS.muted
                            }
                          />
                        </View>
                      )}

                      <View
                        style={
                          styles.reviewUserInfo
                        }
                      >
                        <Text
                          style={
                            styles.reviewUserName
                          }
                        >
                          {reviewName}
                        </Text>

                        <Stars
                          value={
                            reviewRatingValue
                          }
                          size={14}
                        />
                      </View>
                    </View>

                    {reviewComment ? (
                      <Text
                        style={
                          styles.reviewComment
                        }
                      >
                        {reviewComment}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>

          {/* ====================================================
              DELETE - ONLY IF ENABLED
          ==================================================== */}

          {SHOW_DELETE_BUTTON ? (
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={deleteFood}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={COLORS.red}
              />

              <Text
                style={styles.deleteButtonText}
              >
                Delete Food
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* ======================================================
            BOTTOM ADD TO CART BAR
        ====================================================== */}

        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalPrice}>
              ₹{totalPrice.toFixed(0)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              addingToCart &&
              styles.disabledButton,
            ]}
            activeOpacity={0.85}
            disabled={addingToCart}
            onPress={handleAddToCart}
          >
            {addingToCart ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            ) : (
              <>
                <Ionicons
                  name="cart-outline"
                  size={21}
                  color={COLORS.white}
                />

                <Text
                  style={
                    styles.addToCartText
                  }
                >
                  Add to Cart
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.muted,
  },

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  heroContainer: {
    width: "100%",
    height: 290,
    position: "relative",
    backgroundColor: COLORS.lightOrange,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightOrange,
  },

  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "500",
  },

  categoryBadge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },

  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.orange,
  },

  favoriteFloating: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },

  infoCard: {
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  foodName: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    color: COLORS.dark,
  },

  ratingLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  interactiveStar: {
    paddingRight: 3,
  },

  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },

  reviewCount: {
    marginLeft: 5,
    fontSize: 13,
    color: COLORS.muted,
  },

  description: {
    marginTop: 15,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
  },

  statsContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  statItem: {
    minWidth: "43%",
    flexDirection: "row",
    alignItems: "center",
  },

  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: COLORS.lightOrange,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },

  statValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },

  errorCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  errorText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.red,
  },

  orderCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  priceLabel: {
    marginBottom: 4,
    fontSize: 12,
    color: COLORS.muted,
  },

  price: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.orange,
  },

  quantityBox: {
    height: 42,
    minWidth: 125,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: COLORS.lightOrange,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },

  quantityButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
  },

  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.dark,
  },

  sectionCount: {
    minWidth: 25,
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    textAlign: "center",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.lightOrange,
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: "700",
  },

  reviewForm: {
    padding: 17,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
  },

  ratingQuestion: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 13,
    color: COLORS.muted,
  },

  reviewInput: {
    minHeight: 105,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.dark,
  },

  submitReviewButton: {
    height: 46,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.orange,
  },

  submitReviewText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  disabledButton: {
    opacity: 0.65,
  },

  reviewsLoading: {
    paddingVertical: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewsLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.muted,
  },

  noReviews: {
    marginTop: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  noReviewsTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },

  noReviewsText: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.muted,
  },

  reviewCard: {
    marginTop: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  reviewAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
  },

  reviewAvatarPlaceholder: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  reviewUserInfo: {
    flex: 1,
    marginLeft: 11,
  },

  reviewUserName: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },

  reviewComment: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },

  deleteButton: {
    height: 50,
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  deleteButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.red,
  },

  bottomSpace: {
    height: 20,
  },

  bottomBar: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },

  totalLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  totalPrice: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.dark,
  },

  addToCartButton: {
    minWidth: 170,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.orange,
  },

  addToCartText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
});