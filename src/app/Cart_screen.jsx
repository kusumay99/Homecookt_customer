import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_layout";

// IMPORTANT:
// Change this import path if your AppContext file is in another folder.

const BASE_URL = "https://api.homecookt.com";

const CartScreen = forwardRef((props, ref) => {
  // ============================================================
  // THEME
  // ============================================================

  const {
    isDarkMode,
    colors: contextColors,
  } = useApp();

  // ============================================================
  // STATE
  // ============================================================

  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const [grandTotal, setGrandTotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const [foodImageMap, setFoodImageMap] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  // ============================================================
  // THEME COLORS
  // ============================================================

  const colors = {
    background: isDarkMode ? "#121212" : "#F7F7F7",

    card: isDarkMode ? "#1E1E1E" : "#FFFFFF",

    foreground: isDarkMode ? "#FFFFFF" : "#222222",

    muted: isDarkMode ? "#AAAAAA" : "#777777",

    border: isDarkMode ? "#333333" : "#E5E5E5",

    inputBackground: isDarkMode ? "#252525" : "#FFFFFF",

    secondaryBackground: isDarkMode
      ? "#252525"
      : "#FFF2E8",

    quantityBackground: isDarkMode
      ? "#2A2A2A"
      : "#FFFFFF",

    orange: "#FF7A00",

    orangeDark: "#E86600",

    red: "#E53935",

    green: "#2E7D32",

    white: "#FFFFFF",

    imagePlaceholder: isDarkMode
      ? "#333333"
      : "#EEEEEE",

    shadow: isDarkMode
      ? "#000000"
      : "#000000",
  };

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = useCallback(async () => {
    try {
      const keys = [
        "access_token",
        "accessToken",
        "token",
      ];

      const values = await AsyncStorage.multiGet(keys);

      const token =
        values.find(
          ([key, value]) =>
            key === "access_token" && value
        )?.[1] ||
        values.find(
          ([key, value]) =>
            key === "accessToken" && value
        )?.[1] ||
        values.find(
          ([key, value]) =>
            key === "token" && value
        )?.[1] ||
        null;

      console.log(
        "CART TOKEN =>",
        token
          ? "Token available"
          : "No token found"
      );

      return token;
    } catch (error) {
      console.log(
        "GET TOKEN ERROR:",
        error
      );

      return null;
    }
  }, []);

  // ============================================================
  // HEADERS
  // ============================================================

  const getHeaders = useCallback(async () => {
    const token = await getToken();

    return {
      Accept: "application/json",
      "Content-Type": "application/json",

      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),
    };
  }, [getToken]);

  // ============================================================
  // NORMALIZE IMAGE
  // ============================================================

  const normalizeImageUrl = useCallback(
    (image) => {
      if (!image) {
        return "";
      }

      if (Array.isArray(image)) {
        for (const item of image) {
          const normalized =
            normalizeImageUrl(item);

          if (normalized) {
            return normalized;
          }
        }

        return "";
      }

      if (typeof image === "object") {
        return normalizeImageUrl(
          image?.url ||
          image?.uri ||
          image?.image_url ||
          image?.image ||
          image?.src
        );
      }

      if (typeof image !== "string") {
        return "";
      }

      const trimmed = image.trim();

      if (!trimmed) {
        return "";
      }

      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://")
      ) {
        return trimmed;
      }

      if (trimmed.startsWith("/")) {
        return `${BASE_URL}${trimmed}`;
      }

      return `${BASE_URL}/${trimmed}`;
    },
    []
  );

  // ============================================================
  // EXTRACT FOOD IMAGE
  // ============================================================

  const extractFoodImage = useCallback(
    (item) => {
      if (!item) {
        return "";
      }

      const possibleImages = [
        item?.food_photo,
        item?.food_image,
        item?.image,
        item?.image_url,
        item?.image_urls,

        item?.food?.food_photo,
        item?.food?.food_image,
        item?.food?.image,
        item?.food?.image_url,
        item?.food?.image_urls,

        item?.foodItem?.food_photo,
        item?.foodItem?.food_image,
        item?.foodItem?.image,
        item?.foodItem?.image_url,
        item?.foodItem?.image_urls,
      ];

      for (const image of possibleImages) {
        const normalized =
          normalizeImageUrl(image);

        if (normalized) {
          return normalized;
        }
      }

      return "";
    },
    [normalizeImageUrl]
  );

  // ============================================================
  // GET FOOD ID
  // ============================================================

  const getFoodId = useCallback(
    (item) => {
      if (!item) {
        return null;
      }

      return (
        item?.food_id ??
        item?.foodId ??
        item?.food?.food_id ??
        item?.food?.id ??
        item?.foodItem?.food_id ??
        item?.foodItem?.id ??
        item?.id ??
        null
      );
    },
    []
  );

  // ============================================================
  // FETCH FOOD IMAGES
  // ============================================================

  const fetchFoodImages = useCallback(
    async (items, token) => {
      try {
        if (
          !Array.isArray(items) ||
          items.length === 0
        ) {
          return;
        }

        const missingFoodIds = items
          .filter(
            (item) =>
              !extractFoodImage(item)
          )
          .map((item) =>
            getFoodId(item)
          )
          .filter(Boolean)
          .map(String);

        if (
          missingFoodIds.length === 0
        ) {
          return;
        }

        console.log(
          "FETCHING FOOD IMAGES FOR IDS:",
          missingFoodIds
        );

        const response = await fetch(
          `${BASE_URL}/api/v1/get/fooditems`,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              ...(token
                ? {
                  Authorization: `Bearer ${token}`,
                }
                : {}),
            },
          }
        );

        const responseText =
          await response.text();

        console.log(
          "FOOD ITEMS IMAGE API STATUS:",
          response.status
        );

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "FOOD ITEMS JSON ERROR:",
            error
          );

          return;
        }

        if (!response.ok) {
          console.log(
            "FOOD ITEMS IMAGE API ERROR:",
            responseText
          );

          return;
        }

        let foods = [];

        if (Array.isArray(data)) {
          foods = data;
        } else if (
          Array.isArray(data?.fooditems)
        ) {
          foods = data.fooditems;
        } else if (
          Array.isArray(data?.food_items)
        ) {
          foods = data.food_items;
        } else if (
          Array.isArray(data?.foods)
        ) {
          foods = data.foods;
        } else if (
          Array.isArray(data?.items)
        ) {
          foods = data.items;
        } else if (
          Array.isArray(data?.results)
        ) {
          foods = data.results;
        } else if (
          Array.isArray(data?.data)
        ) {
          foods = data.data;
        }

        console.log(
          "FOOD ITEMS FOUND:",
          foods.length
        );

        if (foods.length === 0) {
          return;
        }

        const newImageMap = {};

        foods.forEach((food) => {
          const foodId =
            food?.food_id ??
            food?.foodId ??
            food?.id ??
            food?._id;

          const image =
            extractFoodImage(food);

          if (
            foodId !== undefined &&
            foodId !== null &&
            image
          ) {
            newImageMap[String(foodId)] =
              image;
          }
        });

        if (
          Object.keys(newImageMap)
            .length > 0
        ) {
          setFoodImageMap(
            (previous) => ({
              ...previous,
              ...newImageMap,
            })
          );
        }
      } catch (error) {
        console.log(
          "FETCH FOOD IMAGES ERROR:",
          error
        );
      }
    },
    [extractFoodImage, getFoodId]
  );

  // ============================================================
  // GET IMAGE URL
  // ============================================================

  const getImageUrl = useCallback(
    (item) => {
      const directImage =
        extractFoodImage(item);

      if (directImage) {
        return directImage;
      }

      const foodId =
        getFoodId(item);

      if (foodId !== null) {
        const mappedImage =
          foodImageMap[
          String(foodId)
          ];

        if (mappedImage) {
          return mappedImage;
        }
      }

      return "";
    },
    [
      extractFoodImage,
      getFoodId,
      foodImageMap,
    ]
  );

  // ============================================================
  // FETCH CART
  // ============================================================

  const fetchCart = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const token =
          await getToken();

        const headers = {
          Accept:
            "application/json",
          "Content-Type":
            "application/json",

          ...(token
            ? {
              Authorization: `Bearer ${token}`,
            }
            : {}),
        };

        const response =
          await fetch(
            `${BASE_URL}/api/v1/cart`,
            {
              method: "GET",
              headers,
            }
          );

        const responseText =
          await response.text();

        console.log(
          "GET CART STATUS:",
          response.status
        );

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "CART JSON PARSE ERROR:",
            error
          );
        }

        if (response.ok) {
          const items =
            Array.isArray(
              data?.items
            )
              ? data.items
              : Array.isArray(data)
                ? data
                : [];

          const subtotal =
            Number(
              data?.cart_summary
                ?.grand_total ??
              data?.grand_total ??
              data?.subtotal ??
              0
            );

          const apiDeliveryFee =
            Number(
              data?.kitchen
                ?.delivery_fee ??
              data?.delivery_fee ??
              0
            );

          const totalWithDelivery =
            subtotal +
            apiDeliveryFee;

          setCartItems(items);
          setGrandTotal(subtotal);
          setDeliveryFee(
            apiDeliveryFee
          );
          setFinalTotal(
            totalWithDelivery
          );

          await fetchFoodImages(
            items,
            token
          );
        } else if (
          response.status === 401
        ) {
          setCartItems([]);
          setCartCount(0);
          setGrandTotal(0);
          setDeliveryFee(0);
          setFinalTotal(0);

          Alert.alert(
            "Session Expired",
            "Please login again to view your cart.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace(
                    "/Login_screen"
                  ),
              },
            ]
          );
        } else {
          Alert.alert(
            "Cart Error",
            data?.detail ||
            data?.message ||
            `Failed to load cart (${response.status})`
          );
        }
      } catch (error) {
        console.log(
          "GET CART ERROR:",
          error
        );

        Alert.alert(
          "Connection Error",
          "Unable to connect to the server. Please check your internet connection."
        );
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [
      getToken,
      fetchFoodImages,
    ]
  );

  // ============================================================
  // FETCH CART COUNT
  // ============================================================

  const fetchCartCount =
    useCallback(async () => {
      try {
        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/cart/count`,
            {
              method: "GET",
              headers,
            }
          );

        const responseText =
          await response.text();

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "COUNT JSON PARSE ERROR:",
            error
          );
        }

        if (response.ok) {
          const count =
            Number(
              data?.count ?? 0
            );

          setCartCount(count);
        }
      } catch (error) {
        console.log(
          "CART COUNT ERROR:",
          error
        );
      }
    }, [getHeaders]);

  // ============================================================
  // REFRESH CART
  // ============================================================

  const refreshCart =
    useCallback(async () => {
      setRefreshing(true);

      try {
        await Promise.all([
          fetchCart(false),
          fetchCartCount(),
        ]);
      } catch (error) {
        console.log(
          "REFRESH CART ERROR:",
          error
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      fetchCart,
      fetchCartCount,
    ]);

  // ============================================================
  // EXPOSE REFRESH CART
  // ============================================================

  useImperativeHandle(
    ref,
    () => ({
      refreshCart,
    }),
    [refreshCart]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCart();
    fetchCartCount();
  }, [
    fetchCart,
    fetchCartCount,
  ]);

  // ============================================================
  // CLEAR CART
  // ============================================================

  const clearCart = () => {
    if (cartItems.length === 0) {
      return;
    }

    Alert.alert(
      "Clear Cart",
      "Are you sure you want to clear the cart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress:
            performClearCart,
        },
      ]
    );
  };

  // ============================================================
  // PERFORM CLEAR CART
  // ============================================================

  const performClearCart =
    async () => {
      try {
        setIsClearing(true);

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/cart`,
            {
              method: "DELETE",
              headers,
            }
          );

        const responseText =
          await response.text();

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "CLEAR CART JSON ERROR:",
            error
          );
        }

        if (response.ok) {
          setCartItems([]);
          setCartCount(0);
          setGrandTotal(0);
          setDeliveryFee(0);
          setFinalTotal(0);

          Alert.alert(
            "Success",
            "Cart cleared successfully"
          );
        } else if (
          response.status === 401
        ) {
          router.replace(
            "/Login_screen"
          );
        } else {
          Alert.alert(
            "Error",
            data?.detail ||
            data?.message ||
            `Failed to clear cart (${response.status})`
          );
        }
      } catch (error) {
        console.log(
          "CLEAR CART ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
          "Unable to clear cart."
        );
      } finally {
        setIsClearing(false);
      }
    };

  // ============================================================
  // REMOVE CART ITEM
  // ============================================================

  const removeCartItem = (
    cartId
  ) => {
    Alert.alert(
      "Remove Item",
      "Do you want to remove this item from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            performRemoveCartItem(
              cartId
            ),
        },
      ]
    );
  };

  const performRemoveCartItem =
    async (cartId) => {
      try {
        setRemovingId(cartId);

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/cart/${cartId}`,
            {
              method: "DELETE",
              headers,
            }
          );

        const responseText =
          await response.text();

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "REMOVE JSON ERROR:",
            error
          );
        }

        if (response.ok) {
          await Promise.all([
            fetchCart(false),
            fetchCartCount(),
          ]);

          Alert.alert(
            "Success",
            "Item removed from cart"
          );
        } else if (
          response.status === 401
        ) {
          Alert.alert(
            "Session Expired",
            "Please login again.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace(
                    "/Login_screen"
                  ),
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            data?.detail ||
            data?.message ||
            `Failed to remove item (${response.status})`
          );
        }
      } catch (error) {
        console.log(
          "REMOVE CART ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
          "Unable to remove item."
        );
      } finally {
        setRemovingId(null);
      }
    };

  // ============================================================
  // UPDATE QUANTITY
  // ============================================================

  const updateCartQuantity =
    async (
      cartId,
      quantity
    ) => {
      if (quantity < 1) {
        return;
      }

      try {
        setUpdatingId(cartId);

        const headers =
          await getHeaders();

        const response =
          await fetch(
            `${BASE_URL}/api/v1/cart/${cartId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                quantity,
              }),
            }
          );

        const responseText =
          await response.text();

        let data = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "UPDATE JSON ERROR:",
            error
          );
        }

        if (response.ok) {
          await Promise.all([
            fetchCart(false),
            fetchCartCount(),
          ]);
        } else if (
          response.status === 401
        ) {
          Alert.alert(
            "Session Expired",
            "Please login again.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace(
                    "/Login_screen"
                  ),
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            data?.detail ||
            data?.message ||
            `Failed to update cart (${response.status})`
          );
        }
      } catch (error) {
        console.log(
          "UPDATE CART ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
          "Unable to update quantity."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (value) => {
    const number =
      Number(value) || 0;

    return `₹${number.toFixed(2)}`;
  };

  // ============================================================
  // RENDER FOOD IMAGE
  // ============================================================

  const renderFoodImage = (
    item
  ) => {
    const imageUrl =
      getImageUrl(item);

    if (!imageUrl) {
      return (
        <View
          style={[
            styles.foodImage,
            styles.imagePlaceholder,
            {
              backgroundColor:
                colors.imagePlaceholder,
            },
          ]}
        >
          <Ionicons
            name="restaurant-outline"
            size={30}
            color={colors.muted}
          />
        </View>
      );
    }

    return (
      <Image
        source={{
          uri: imageUrl,
        }}
        style={styles.foodImage}
        resizeMode="cover"
        onError={(error) => {
          console.log(
            "CART IMAGE ERROR:",
            imageUrl,
            error?.nativeEvent
              ?.error
          );
        }}
      />
    );
  };

  // ============================================================
  // CART ITEM
  // ============================================================

  const renderCartItem = ({
    item,
  }) => {
    const cartId =
      item?.cart_id ??
      item?.id;

    const quantity =
      Number(item?.quantity) || 1;

    const price =
      Number(item?.price) || 0;

    const itemTotal =
      Number(item?.subtotal) ||
      price * quantity;

    const isUpdating =
      updatingId === cartId;

    const isRemoving =
      removingId === cartId;

    return (
      <View
        style={[
          styles.cartCard,
          {
            backgroundColor:
              colors.card,

            borderColor:
              colors.border,
          },
        ]}
      >
        {renderFoodImage(item)}

        <View
          style={
            styles.itemContent
          }
        >
          <Text
            style={[
              styles.foodName,
              {
                color:
                  colors.foreground,
              },
            ]}
            numberOfLines={2}
          >
            {item?.food_name ||
              item?.name ||
              "Food Item"}
          </Text>

          <Text
            style={[
              styles.foodPrice,
              {
                color:
                  colors.orange,
              },
            ]}
          >
            {formatPrice(price)}
          </Text>

          <View
            style={
              styles.quantityContainer
            }
          >
            <TouchableOpacity
              style={[
                styles.quantityButton,
                {
                  backgroundColor:
                    colors.quantityBackground,

                  borderColor:
                    colors.border,
                },
              ]}
              disabled={
                isUpdating ||
                quantity <= 1
              }
              onPress={() =>
                updateCartQuantity(
                  cartId,
                  quantity - 1
                )
              }
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  {
                    color:
                      quantity <= 1
                        ? colors.muted
                        : colors.foreground,
                  },
                ]}
              >
                −
              </Text>
            </TouchableOpacity>

            {isUpdating ? (
              <ActivityIndicator
                size="small"
                style={
                  styles.quantityLoader
                }
                color={
                  colors.orange
                }
              />
            ) : (
              <Text
                style={[
                  styles.quantityText,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                {quantity}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.quantityButton,
                {
                  backgroundColor:
                    colors.quantityBackground,

                  borderColor:
                    colors.border,
                },
              ]}
              disabled={isUpdating}
              onPress={() =>
                updateCartQuantity(
                  cartId,
                  quantity + 1
                )
              }
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={styles.itemRight}
        >
          <Text
            style={[
              styles.itemTotal,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            {formatPrice(
              itemTotal
            )}
          </Text>

          <TouchableOpacity
            style={
              styles.deleteButton
            }
            disabled={isRemoving}
            activeOpacity={0.7}
            onPress={() =>
              removeCartItem(
                cartId
              )
            }
          >
            {isRemoving ? (
              <ActivityIndicator
                size="small"
                color={colors.red}
              />
            ) : (
              <Ionicons
                name="trash"
                size={22}
                color={colors.red}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================================
  // EMPTY CART
  // ============================================================

  const renderEmptyCart = () => {
    if (isLoading) {
      return (
        <View
          style={
            styles.centerContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.orange
            }
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Loading cart...
          </Text>
        </View>
      );
    }

    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <View
          style={[
            styles.emptyIconContainer,
            {
              backgroundColor:
                colors.secondaryBackground,
            },
          ]}
        >
          <Ionicons
            name="cart-outline"
            size={48}
            color={colors.orange}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color:
                colors.foreground,
            },
          ]}
        >
          Your cart is empty
        </Text>

        <Text
          style={[
            styles.emptySubtitle,
            {
              color:
                colors.muted,
            },
          ]}
        >
          Add some delicious food
          to your cart
        </Text>

        <TouchableOpacity
          style={[
            styles.shopButton,
            {
              backgroundColor:
                colors.orange,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            router.replace(
              "/Main_navigation"
            );
          }}
        >
          <Text
            style={
              styles.shopButtonText
            }
          >
            Browse Food
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // SUMMARY
  // ============================================================

  const renderSummary = () => {
    if (cartItems.length === 0) {
      return null;
    }

    return (
      <View
        style={[
          styles.summaryContainer,
          {
            backgroundColor:
              colors.card,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.summaryRow
          }
        >
          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Subtotal
          </Text>

          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            {formatPrice(
              grandTotal
            )}
          </Text>
        </View>

        <View
          style={
            styles.summaryRow
          }
        >
          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Delivery
          </Text>

          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  deliveryFee === 0
                    ? colors.green
                    : colors.foreground,
              },
            ]}
          >
            {deliveryFee === 0
              ? "FREE"
              : formatPrice(
                deliveryFee
              )}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor:
                colors.border,
            },
          ]}
        />

        <View
          style={
            styles.summaryRow
          }
        >
          <Text
            style={[
              styles.grandTotalLabel,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Grand Total
          </Text>

          <Text
            style={[
              styles.grandTotalValue,
              {
                color:
                  colors.orange,
              },
            ]}
          >
            {formatPrice(
              finalTotal
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            {
              backgroundColor:
                colors.orange,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            router.push(
              "/Checkout_screen"
            );
          }}
        >
          <Text
            style={
              styles.checkoutButtonText
            }
          >
            Proceed to Checkout
          </Text>

          <Ionicons
            name="arrow-forward"
            size={21}
            color="#FFFFFF"
            style={
              styles.checkoutArrow
            }
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.background,
        },
      ]}
      edges={[
        "top",
        "left",
        "right",
        "bottom",
      ]}
    >
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          colors.background
        }
      />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.background,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.headerTitleContainer
          }
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Cart
          </Text>

          {cartCount > 0 && (
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor:
                    colors.orange,
                },
              ]}
            >
              <Text
                style={
                  styles.countBadgeText
                }
              >
                {cartCount}
              </Text>
            </View>
          )}
        </View>

        {cartItems.length > 0 && (
          <TouchableOpacity
            style={
              styles.clearButton
            }
            disabled={isClearing}
            activeOpacity={0.7}
            onPress={clearCart}
          >
            {isClearing ? (
              <ActivityIndicator
                size="small"
                color={colors.red}
              />
            ) : (
              <Ionicons
                name="trash"
                size={23}
                color={colors.red}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* BODY */}

      {cartItems.length === 0 &&
        !isLoading ? (
        renderEmptyCart()
      ) : (
        <View
          style={styles.body}
        >
          <FlatList
            data={cartItems}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.cart_id ??
                item?.id ??
                index
              )
            }
            renderItem={
              renderCartItem
            }
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  refreshCart
                }
                tintColor={
                  colors.orange
                }
                colors={[
                  colors.orange,
                ]}
              />
            }
          />

          {renderSummary()}
        </View>
      )}
    </SafeAreaView>
  );
});

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  clearButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    flex: 1,
  },

  listContent: {
    padding: 16,
    paddingBottom: 20,
  },

  cartCard: {
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",

    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },

      android: {
        elevation: 2,
      },
    }),
  },

  foodImage: {
    width: 82,
    height: 82,
    borderRadius: 10,
    backgroundColor: "#EEEEEE",
  },

  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  itemContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  foodName: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },

  foodPrice: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "700",
  },

  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "500",
  },

  quantityText: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },

  quantityLoader: {
    width: 32,
    height: 30,
  },

  itemRight: {
    minWidth: 62,
    height: 88,
    alignItems: "flex-end",
    justifyContent:
      "space-between",
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
  },

  deleteButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom:
      Platform.OS === "ios"
        ? 12
        : 18,
    borderTopWidth: 1,

    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },

      android: {
        elevation: 8,
      },
    }),
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: "400",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: 8,
  },

  grandTotalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },

  grandTotalValue: {
    fontSize: 18,
    fontWeight: "800",
  },

  checkoutButton: {
    height: 54,
    borderRadius: 12,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  checkoutArrow: {
    marginLeft: 10,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },

  shopButton: {
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CartScreen;
