import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_layout";

const BASE_URL = "https://api.homecookt.com";

const CheckoutScreen = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [deliveryType, setDeliveryType] =
    useState("self_pickup");

  const [isLoading, setIsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] =
    useState(true);

  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [cartItems, setCartItems] = useState([]);

  // ============================================================
  // THEME
  // ============================================================

  const {
    isDarkMode,
    colors,
  } = useApp();

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (value) => {
    const number = Number(value) || 0;
    return `₹${number.toFixed(2)}`;
  };

  // ============================================================
  // FETCH CART
  // ============================================================

  const fetchCart = useCallback(async () => {
    try {
      setIsCartLoading(true);

      const token =
        await AsyncStorage.getItem(
          "access_token"
        );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/Login_screen");
              },
            },
          ]
        );

        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/v1/cart`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      console.log(
        "CHECKOUT CART STATUS:",
        response.status
      );

      console.log(
        "CHECKOUT CART BODY:",
        responseText
      );

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "CHECKOUT CART JSON ERROR:",
          error
        );
      }

      if (response.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please login again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/Login_screen");
              },
            },
          ]
        );

        return;
      }

      if (!response.ok) {
        Alert.alert(
          "Cart Error",
          data?.detail ||
          data?.message ||
          `Unable to load cart (${response.status})`
        );

        return;
      }

      const items = Array.isArray(data?.items)
        ? data.items
        : [];

      const apiSubtotal = Number(
        data?.cart_summary?.grand_total ??
        0
      );

      const apiDeliveryFee = Number(
        data?.kitchen?.delivery_fee ?? 0
      );

      const total =
        apiSubtotal + apiDeliveryFee;

      setCartItems(items);
      setSubtotal(apiSubtotal);
      setDeliveryFee(apiDeliveryFee);
      setGrandTotal(total);

      console.log(
        "CHECKOUT SUBTOTAL:",
        apiSubtotal
      );

      console.log(
        "CHECKOUT DELIVERY:",
        apiDeliveryFee
      );

      console.log(
        "CHECKOUT GRAND TOTAL:",
        total
      );
    } catch (error) {
      console.log(
        "FETCH CHECKOUT CART ERROR:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Unable to load your cart. Please try again."
      );
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ============================================================
  // CHECKOUT API
  // ============================================================

  const checkout = async () => {
    // ----------------------------------------------------------
    // CART VALIDATION
    // ----------------------------------------------------------

    if (cartItems.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty."
      );

      return;
    }

    // ----------------------------------------------------------
    // ADDRESS VALIDATION
    // ----------------------------------------------------------

    if (!address.trim()) {
      Alert.alert(
        "Delivery Address",
        "Please enter your delivery address."
      );

      return;
    }

    // ----------------------------------------------------------
    // LOADING
    // ----------------------------------------------------------

    setIsLoading(true);

    try {
      const token =
        await AsyncStorage.getItem(
          "access_token"
        );

      console.log(
        "CHECKOUT TOKEN:",
        token
          ? "Token available"
          : "No token"
      );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Your session has expired. Please login again."
        );

        return;
      }

      // --------------------------------------------------------
      // REQUEST BODY
      // --------------------------------------------------------

      const requestBody = {
        delivery_address:
          address.trim(),

        payment_method:
          paymentMethod,

        delivery_type:
          deliveryType,
      };

      console.log(
        "================================"
      );

      console.log(
        "CHECKOUT REQUEST:"
      );

      console.log(
        JSON.stringify(
          requestBody,
          null,
          2
        )
      );

      console.log(
        "================================"
      );

      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `${BASE_URL}/api/v1/cart/checkout`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const responseText =
        await response.text();

      console.log(
        "CHECKOUT STATUS:",
        response.status
      );

      console.log(
        "CHECKOUT RESPONSE:",
        responseText
      );

      // --------------------------------------------------------
      // PARSE
      // --------------------------------------------------------

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "CHECKOUT JSON PARSE ERROR:",
          error
        );
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (
        response.status >= 200 &&
        response.status < 300
      ) {
        const orderId =
          data?.order_id ??
          data?.order?.order_id ??
          "N/A";

        const orderStatus =
          data?.order_status ??
          data?.order?.status ??
          "N/A";

        const paymentStatus =
          data?.payment_status ??
          data?.payment?.status ??
          "N/A";

        const message =
          data?.message ||
          "Your order has been placed successfully.";

        Alert.alert(
          "Order Placed Successfully 🎉",
          `${message}\n\n` +
          `Order ID: ${orderId}\n` +
          `Status: ${orderStatus}\n` +
          `Payment: ${paymentStatus}`,
          [
            {
              text: "OK",
              onPress: () => {
                /*
                 * Replace the current checkout route
                 * with your main navigation screen.
                 */
                router.replace(
                  "/Main_navigation"
                );
              },
            },
          ]
        );

        return;
      }

      // --------------------------------------------------------
      // UNAUTHORIZED
      // --------------------------------------------------------

      if (response.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please login again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/Login");
              },
            },
          ]
        );

        return;
      }

      // --------------------------------------------------------
      // ERROR
      // --------------------------------------------------------

      let errorMessage =
        `Checkout failed (${response.status})`;

      if (
        typeof data === "string" &&
        data.trim()
      ) {
        errorMessage = data;
      } else if (data?.detail) {
        errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(
              data.detail
            );
      } else if (data?.message) {
        errorMessage =
          data.message;
      } else if (responseText) {
        errorMessage =
          responseText;
      }

      Alert.alert(
        "Checkout Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "CHECKOUT ERROR:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // DELIVERY TYPE
  // ============================================================

  const renderDeliveryType = () => {
    return (
      <View>
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.foreground,
            },
          ]}
        >
          Delivery Type
        </Text>

        <View style={styles.optionContainer}>
          {/* SELF PICKUP */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  deliveryType ===
                    "self_pickup"
                    ? colors.orange
                    : colors.border,
              },
            ]}
            onPress={() =>
              setDeliveryType(
                "self_pickup"
              )
            }
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    deliveryType ===
                      "self_pickup"
                      ? colors.orange
                      : colors.muted,
                },
              ]}
            >
              {deliveryType ===
                "self_pickup" && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor:
                          colors.orange,
                      },
                    ]}
                  />
                )}
            </View>

            <View
              style={
                styles.optionTextContainer
              }
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                Self Pickup
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                Pick up your order yourself
              </Text>
            </View>
          </TouchableOpacity>

          {/* DELIVERY PARTNER */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  deliveryType ===
                    "delivery_partner"
                    ? colors.orange
                    : colors.border,
              },
            ]}
            onPress={() =>
              setDeliveryType(
                "delivery_partner"
              )
            }
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    deliveryType ===
                      "delivery_partner"
                      ? colors.orange
                      : colors.muted,
                },
              ]}
            >
              {deliveryType ===
                "delivery_partner" && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor:
                          colors.orange,
                      },
                    ]}
                  />
                )}
            </View>

            <View
              style={
                styles.optionTextContainer
              }
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                Delivery Partner
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                Get your order delivered
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================================
  // PAYMENT METHOD
  // ============================================================

  const renderPaymentMethod = () => {
    return (
      <View>
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.foreground,
            },
          ]}
        >
          Payment Method
        </Text>

        <View style={styles.optionContainer}>
          {/* COD */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  paymentMethod ===
                    "COD"
                    ? colors.orange
                    : colors.border,
              },
            ]}
            onPress={() =>
              setPaymentMethod("COD")
            }
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    paymentMethod ===
                      "COD"
                      ? colors.orange
                      : colors.muted,
                },
              ]}
            >
              {paymentMethod ===
                "COD" && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor:
                          colors.orange,
                      },
                    ]}
                  />
                )}
            </View>

            <View
              style={
                styles.optionTextContainer
              }
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                Cash on Delivery
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                Pay when you receive your order
              </Text>
            </View>
          </TouchableOpacity>

          {/* ONLINE */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  paymentMethod ===
                    "ONLINE"
                    ? colors.orange
                    : colors.border,
              },
            ]}
            onPress={() =>
              setPaymentMethod(
                "ONLINE"
              )
            }
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    paymentMethod ===
                      "ONLINE"
                      ? colors.orange
                      : colors.muted,
                },
              ]}
            >
              {paymentMethod ===
                "ONLINE" && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor:
                          colors.orange,
                      },
                    ]}
                  />
                )}
            </View>

            <View
              style={
                styles.optionTextContainer
              }
            >
              <Text
                style={[
                  styles.optionTitle,
                  {
                    color:
                      colors.foreground,
                  },
                ]}
              >
                Online Payment
              </Text>

              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                Pay securely online
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================================
  // ORDER ITEMS
  // ============================================================

  const renderOrderItems = () => {
    return (
      <View
        style={[
          styles.itemsCard,
          {
            backgroundColor:
              colors.card,
            borderColor:
              colors.border,
          },
        ]}
      >
        {cartItems.map(
          (item, index) => {
            const quantity =
              Number(
                item?.quantity
              ) || 1;

            const price =
              Number(
                item?.price
              ) || 0;

            const itemTotal =
              Number(
                item?.subtotal
              ) ||
              price * quantity;

            return (
              <View
                key={String(
                  item?.cart_id ??
                  item?.id ??
                  index
                )}
                style={[
                  styles.itemRow,
                  index <
                  cartItems.length -
                  1 && {
                    borderBottomWidth: 1,
                    borderBottomColor:
                      colors.border,
                  },
                ]}
              >
                <View
                  style={
                    styles.itemInfo
                  }
                >
                  <Text
                    numberOfLines={
                      2
                    }
                    style={[
                      styles.itemName,
                      {
                        color:
                          colors.foreground,
                      },
                    ]}
                  >
                    {item?.food_name ||
                      "Food Item"}
                  </Text>

                  <Text
                    style={[
                      styles.itemQuantity,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    Qty: {quantity}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.itemPrice,
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
              </View>
            );
          }
        )}
      </View>
    );
  };

  // ============================================================
  // SUMMARY ROW
  // ============================================================

  const SummaryRow = ({
    title,
    value,
    bold = false,
  }) => {
    return (
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryTitle,
            {
              color:
                colors.foreground,
              fontSize:
                bold ? 17 : 15,
              fontWeight:
                bold
                  ? "700"
                  : "500",
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.summaryValue,
            {
              color:
                colors.orange,
              fontSize:
                bold ? 17 : 15,
              fontWeight:
                bold
                  ? "700"
                  : "600",
            },
          ]}
        >
          {value}
        </Text>
      </View>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isCartLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            colors.background
          }
        />

        <View
          style={
            styles.loadingScreen
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.orange}
          />

          <Text
            style={[
              styles.loadingScreenText,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Loading checkout...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (cartItems.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            colors.background
          }
        />

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={[
                styles.backIcon,
                {
                  color:
                    colors.foreground,
                },
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Checkout
          </Text>

          <View
            style={styles.headerRight}
          />
        </View>

        <View
          style={
            styles.emptyCheckout
          }
        >
          <Text
            style={
              styles.emptyCheckoutEmoji
            }
          >
            🛒
          </Text>

          <Text
            style={[
              styles.emptyCheckoutTitle,
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
              styles.emptyCheckoutText,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Add food to your cart before checking out.
          </Text>

          <TouchableOpacity
            style={[
              styles.browseButton,
              {
                backgroundColor:
                  colors.orange,
              },
            ]}
            onPress={() =>
              router.replace(
                "/Main_navigation"
              )
            }
          >
            <Text
              style={
                styles.browseButtonText
              }
            >
              Browse Food
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={[
                styles.backIcon,
                {
                  color:
                    colors.foreground,
                },
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Checkout
          </Text>

          <View
            style={styles.headerRight}
          />
        </View>

        {/* CONTENT */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* ADDRESS */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Delivery Address
          </Text>

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter delivery address"
            placeholderTextColor={
              colors.muted
            }
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.addressInput,
              {
                color:
                  colors.foreground,
                backgroundColor:
                  colors.inputBackground,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* DELIVERY */}

          {renderDeliveryType()}

          {/* PAYMENT */}

          {renderPaymentMethod()}

          {/* ITEMS */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Your Items
          </Text>

          {renderOrderItems()}

          {/* SUMMARY */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.foreground,
              },
            ]}
          >
            Order Summary
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <SummaryRow
              title="Subtotal"
              value={formatPrice(
                subtotal
              )}
            />

            <SummaryRow
              title="Delivery"
              value={
                deliveryFee === 0
                  ? "FREE"
                  : formatPrice(
                    deliveryFee
                  )
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            />

            <SummaryRow
              title="Grand Total"
              value={formatPrice(
                grandTotal
              )}
              bold
            />
          </View>

          {/* PLACE ORDER */}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={checkout}
            style={[
              styles.placeOrderButton,
              {
                backgroundColor:
                  isLoading
                    ? "#AAAAAA"
                    : colors.orange,
              },
            ]}
          >
            {isLoading ? (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Placing Order...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.placeOrderText
                }
              >
                Place Order ·{" "}
                {formatPrice(
                  grandTotal
                )}
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.bottomSpacing
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 38,
    fontWeight: "300",
    marginTop: -5,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  headerRight: {
    width: 42,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  addressInput: {
    minHeight: 105,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 25,
  },

  optionContainer: {
    marginBottom: 25,
  },

  optionCard: {
    minHeight: 70,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  optionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  itemsCard: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 25,
  },

  itemRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },

  itemQuantity: {
    fontSize: 12,
    marginTop: 4,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },

  summaryCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 18,
    marginBottom: 30,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryTitle: {
    flex: 1,
  },

  summaryValue: {
    textAlign: "right",
  },

  divider: {
    height: 1,
    marginVertical: 8,
  },

  placeOrderButton: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },

  bottomSpacing: {
    height: 30,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingScreenText: {
    marginTop: 12,
    fontSize: 14,
  },

  emptyCheckout: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyCheckoutEmoji: {
    fontSize: 55,
    marginBottom: 15,
  },

  emptyCheckoutTitle: {
    fontSize: 21,
    fontWeight: "700",
  },

  emptyCheckoutText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },

  browseButton: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CheckoutScreen;