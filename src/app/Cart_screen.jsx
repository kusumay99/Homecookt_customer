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

const BASE_URL = "https://api.homecookt.com";

const CartScreen = forwardRef((props, ref) => {
  // ============================================================
  // STATE
  // ============================================================

  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const [grandTotal, setGrandTotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const isDark = false;

  // ============================================================
  // COLORS
  // ============================================================

  const colors = {
    background: isDark ? "#121212" : "#F7F7F7",
    card: isDark ? "#1E1E1E" : "#FFFFFF",
    foreground: isDark ? "#FFFFFF" : "#222222",
    muted: isDark ? "#AAAAAA" : "#777777",
    border: isDark ? "#333333" : "#E5E5E5",

    orange: "#FF7A00",
    red: "#E53935",
    green: "#2E7D32",

    imagePlaceholder: isDark ? "#333333" : "#EEEEEE",
  };

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      console.log(
        "CART TOKEN =>",
        token ? "Token available" : "No token found"
      );

      return token;
    } catch (error) {
      console.log("GET TOKEN ERROR:", error);
      return null;
    }
  };

  // ============================================================
  // HEADERS
  // ============================================================

  const getHeaders = async () => {
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
  };

  // ============================================================
  // FETCH CART
  // ============================================================

  const fetchCart = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      const headers = await getHeaders();

      const response = await fetch(`${BASE_URL}/api/v1/cart`, {
        method: "GET",
        headers,
      });

      const responseText = await response.text();

      console.log("GET CART STATUS:", response.status);
      console.log("GET CART BODY:", responseText);

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.log("CART JSON PARSE ERROR:", error);
      }

      if (response.ok) {
        const items = Array.isArray(data?.items)
          ? data.items
          : [];

        const subtotal = Number(
          data?.cart_summary?.grand_total ?? 0
        );

        const apiDeliveryFee = Number(
          data?.kitchen?.delivery_fee ?? 0
        );

        const totalWithDelivery =
          subtotal + apiDeliveryFee;

        setCartItems(items);
        setGrandTotal(subtotal);
        setDeliveryFee(apiDeliveryFee);
        setFinalTotal(totalWithDelivery);

        console.log("================================");
        console.log("CART SUCCESS");
        console.log("Cart Items:", items);
        console.log("Subtotal:", subtotal);
        console.log("Delivery Fee:", apiDeliveryFee);
        console.log("Final Total:", totalWithDelivery);
        console.log("================================");
      } else if (response.status === 401) {
        console.log("CART 401 - TOKEN EXPIRED");

        setCartItems([]);
        setGrandTotal(0);
        setDeliveryFee(0);
        setFinalTotal(0);

        Alert.alert(
          "Session Expired",
          "Please login again to view your cart."
        );
      } else {
        const errorMessage =
          data?.detail ||
          data?.message ||
          `Failed to load cart (${response.status})`;

        Alert.alert("Cart Error", errorMessage);
      }
    } catch (error) {
      console.log("GET CART ERROR:", error);

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  // ============================================================
  // FETCH CART COUNT
  // ============================================================

  const fetchCartCount = useCallback(async () => {
    try {
      const headers = await getHeaders();

      const response = await fetch(
        `${BASE_URL}/api/v1/cart/count`,
        {
          method: "GET",
          headers,
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.log("COUNT JSON PARSE ERROR:", error);
      }

      if (response.ok) {
        const count = Number(data?.count ?? 0);

        setCartCount(count);

        console.log("Cart Count:", count);
      }
    } catch (error) {
      console.log("CART COUNT ERROR:", error);
    }
  }, []);

  // ============================================================
  // REFRESH CART
  // ============================================================

  const refreshCart = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchCart(false),
        fetchCartCount(),
      ]);
    } catch (error) {
      console.log("REFRESH CART ERROR:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCart, fetchCartCount]);

  // ============================================================
  // EXPOSE REFRESH CART TO MAIN NAVIGATION
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
  }, [fetchCart, fetchCartCount]);

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
          onPress: performClearCart,
        },
      ]
    );
  };

  // ============================================================
  // PERFORM CLEAR CART
  // ============================================================

  const performClearCart = async () => {
    try {
      setIsClearing(true);

      const headers = await getHeaders();

      const response = await fetch(
        `${BASE_URL}/api/v1/cart`,
        {
          method: "DELETE",
          headers,
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.log("CLEAR CART JSON ERROR:", error);
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
      } else {
        Alert.alert(
          "Error",
          data?.detail ||
            data?.message ||
            `Failed to clear cart (${response.status})`
        );
      }
    } catch (error) {
      console.log("CLEAR CART ERROR:", error);

      Alert.alert(
        "Error",
        error?.message || "Unable to clear cart."
      );
    } finally {
      setIsClearing(false);
    }
  };

  // ============================================================
  // REMOVE CART ITEM
  // ============================================================

  const removeCartItem = (cartId) => {
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
            performRemoveCartItem(cartId),
        },
      ]
    );
  };

  // ============================================================
  // PERFORM REMOVE
  // ============================================================

  const performRemoveCartItem = async (cartId) => {
    try {
      setRemovingId(cartId);

      const headers = await getHeaders();

      const response = await fetch(
        `${BASE_URL}/api/v1/cart/${cartId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.log("REMOVE JSON ERROR:", error);
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
      } else {
        Alert.alert(
          "Error",
          data?.detail ||
            data?.message ||
            `Failed to remove item (${response.status})`
        );
      }
    } catch (error) {
      console.log("REMOVE CART ERROR:", error);

      Alert.alert(
        "Error",
        error?.message || "Unable to remove item."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ============================================================
  // UPDATE QUANTITY
  // ============================================================

  const updateCartQuantity = async (
    cartId,
    quantity
  ) => {
    if (quantity < 1) {
      return;
    }

    try {
      setUpdatingId(cartId);

      const headers = await getHeaders();

      const response = await fetch(
        `${BASE_URL}/api/v1/cart/${cartId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            quantity,
          }),
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.log("UPDATE JSON ERROR:", error);
      }

      if (response.ok) {
        await Promise.all([
          fetchCart(false),
          fetchCartCount(),
        ]);
      } else {
        Alert.alert(
          "Error",
          data?.detail ||
            data?.message ||
            `Failed to update cart (${response.status})`
        );
      }
    } catch (error) {
      console.log("UPDATE CART ERROR:", error);

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
    const number = Number(value) || 0;
    return `₹${number.toFixed(2)}`;
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (item) => {
    const image =
      item?.food_photo ||
      item?.food_image ||
      item?.image ||
      item?.food?.image ||
      item?.food?.food_photo ||
      "";

    return typeof image === "string"
      ? image
      : "";
  };

  // ============================================================
  // IMAGE
  // ============================================================

  const renderFoodImage = (item) => {
    const imageUrl = getImageUrl(item);

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
          <Text style={styles.placeholderEmoji}>
            🍴
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.foodImage}
        resizeMode="cover"
        onError={(error) => {
          console.log(
            "IMAGE ERROR:",
            error?.nativeEvent?.error
          );
        }}
      />
    );
  };

  // ============================================================
  // CART ITEM
  // ============================================================

  const renderCartItem = ({ item }) => {
    const cartId = item?.cart_id;

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
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {renderFoodImage(item)}

        <View style={styles.itemContent}>
          <Text
            style={[
              styles.foodName,
              { color: colors.foreground },
            ]}
            numberOfLines={2}
          >
            {item?.food_name || "Food Item"}
          </Text>

          <Text
            style={[
              styles.foodPrice,
              { color: colors.orange },
            ]}
          >
            {formatPrice(price)}
          </Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                { borderColor: colors.border },
              ]}
              disabled={
                isUpdating || quantity <= 1
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
                style={styles.quantityLoader}
                color={colors.orange}
              />
            ) : (
              <Text
                style={[
                  styles.quantityText,
                  { color: colors.foreground },
                ]}
              >
                {quantity}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.quantityButton,
                { borderColor: colors.border },
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
                  { color: colors.foreground },
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text
            style={[
              styles.itemTotal,
              { color: colors.foreground },
            ]}
          >
            {formatPrice(itemTotal)}
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            disabled={isRemoving}
            onPress={() =>
              removeCartItem(cartId)
            }
          >
            {isRemoving ? (
              <ActivityIndicator
                size="small"
                color={colors.red}
              />
            ) : (
              <Text
                style={[
                  styles.deleteIcon,
                  { color: colors.red },
                ]}
              >
                🗑
              </Text>
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
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.orange}
          />

          <Text
            style={[
              styles.loadingText,
              { color: colors.muted },
            ]}
          >
            Loading cart...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconContainer,
            {
              backgroundColor: isDark
                ? "#2A2A2A"
                : "#FFF2E8",
            },
          ]}
        >
          <Text style={styles.emptyEmoji}>
            🛒
          </Text>
        </View>

        <Text
          style={[
            styles.emptyTitle,
            { color: colors.foreground },
          ]}
        >
          Your cart is empty
        </Text>

        <Text
          style={[
            styles.emptySubtitle,
            { color: colors.muted },
          ]}
        >
          Add some delicious food to your cart
        </Text>

        <TouchableOpacity
          style={[
            styles.shopButton,
            {
              backgroundColor:
                colors.orange,
            },
          ]}
          onPress={() => {
            router.replace("/Main_navigation");
          }}
        >
          <Text style={styles.shopButtonText}>
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
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: colors.muted },
            ]}
          >
            Subtotal
          </Text>

          <Text
            style={[
              styles.summaryValue,
              { color: colors.foreground },
            ]}
          >
            {formatPrice(grandTotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: colors.muted },
            ]}
          >
            Delivery
          </Text>

          <Text
            style={[
              styles.summaryValue,
              { color: colors.foreground },
            ]}
          >
            {deliveryFee === 0
              ? "FREE"
              : formatPrice(deliveryFee)}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
            },
          ]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.grandTotalLabel,
              { color: colors.foreground },
            ]}
          >
            Grand Total
          </Text>

          <Text
            style={[
              styles.grandTotalValue,
              { color: colors.orange },
            ]}
          >
            {formatPrice(finalTotal)}
          </Text>
        </View>

        {/* ======================================================
            PROCEED TO CHECKOUT
        ====================================================== */}

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
            router.push("/Checkout_screen");
          }}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout
          </Text>

          <Text style={styles.checkoutArrow}>
            →
          </Text>
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
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle={
          isDark
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
          style={styles.headerTitleContainer}
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
              <Text style={styles.countBadgeText}>
                {cartCount}
              </Text>
            </View>
          )}
        </View>

        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            disabled={isClearing}
            onPress={clearCart}
          >
            {isClearing ? (
              <ActivityIndicator
                size="small"
                color={colors.red}
              />
            ) : (
              <Text
                style={[
                  styles.clearIcon,
                  { color: colors.red },
                ]}
              >
                🗑
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* BODY */}

      {cartItems.length === 0 &&
      !isLoading ? (
        renderEmptyCart()
      ) : (
        <View style={styles.body}>
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) =>
              String(
                item?.cart_id ??
                  item?.id ??
                  index
              )
            }
            renderItem={renderCartItem}
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshCart}
                tintColor={colors.orange}
                colors={[colors.orange]}
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
    justifyContent: "space-between",
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

  clearIcon: {
    fontSize: 20,
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

  placeholderEmoji: {
    fontSize: 28,
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
    justifyContent: "space-between",
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
  },

  deleteButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteIcon: {
    fontSize: 18,
  },

  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom:
      Platform.OS === "ios" ? 12 : 18,
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
    justifyContent: "space-between",
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
    color: "#FFFFFF",
    fontSize: 22,
    marginLeft: 10,
    marginTop: -2,
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

  emptyEmoji: {
    fontSize: 42,
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