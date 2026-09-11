import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// Change this only if your backend uses a different
// order-history endpoint.
const ORDERS_ENDPOINT = "/api/v1/orders";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#FF8A00",
  gold: "#FFC107",
  green: "#22C55E",

  background: "#F8F8F8",
  darkBackground: "#111111",

  card: "#FFFFFF",
  darkCard: "#1E1E1E",

  foreground: "#222222",
  darkForeground: "#FFFFFF",

  mutedForeground: "#888888",
  darkMutedForeground: "#AAAAAA",

  muted: "#F1F1F1",
  darkMuted: "#2A2420",

  border: "#EEEEEE",
  darkBorder: "#333333",

  destructive: "#EF4444",
};

// ============================================================
// ORDER HISTORY SCREEN
// ============================================================

const OrderHistoryScreen = ({ navigation }) => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [orders, setOrders] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // Replace this with your global theme context later.
  const [isDark, setIsDark] =
    useState(false);

  // ==========================================================
  // FETCH ORDERS
  // ==========================================================

  const fetchOrders = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      // ------------------------------------------------------
      // GET TOKEN
      // ------------------------------------------------------

      const token =
        await AsyncStorage.getItem(
          "access_token"
        );

      if (!token) {
        setOrders([]);

        Alert.alert(
          "Login Required",
          "Please login to view your orders.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation?.navigate?.(
                  "Login"
                );
              },
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await fetch(
        `${BASE_URL}${ORDERS_ENDPOINT}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Orders status:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "Orders response:",
        responseText
      );

      // ------------------------------------------------------
      // TOKEN EXPIRED
      // ------------------------------------------------------

      if (response.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.multiRemove(
                  [
                    "access_token",
                    "refresh_token",
                  ]
                );

                navigation?.reset?.({
                  index: 0,
                  routes: [
                    {
                      name: "Login",
                    },
                  ],
                });
              },
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // OTHER HTTP ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          `Failed to fetch orders. Status: ${response.status}`
        );
      }

      // ------------------------------------------------------
      // PARSE JSON
      // ------------------------------------------------------

      let data;

      try {
        data = JSON.parse(
          responseText
        );
      } catch (error) {
        throw new Error(
          "Invalid response received from server."
        );
      }

      console.log(
        "Parsed orders:",
        data
      );

      // ------------------------------------------------------
      // SUPPORT MULTIPLE RESPONSE FORMATS
      // ------------------------------------------------------

      let orderList = [];

      if (Array.isArray(data)) {
        orderList = data;
      } else if (
        Array.isArray(data?.data)
      ) {
        orderList = data.data;
      } else if (
        Array.isArray(data?.orders)
      ) {
        orderList = data.orders;
      } else if (
        Array.isArray(data?.results)
      ) {
        orderList = data.results;
      }

      setOrders(orderList);
    } catch (error) {
      console.log(
        "Fetch orders error:",
        error
      );

      setOrders([]);

      Alert.alert(
        "Unable to Load Orders",
        error?.message ||
          "Something went wrong while loading your orders."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================================
  // REFRESH WHEN SCREEN GETS FOCUS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      fetchOrders(false);
    }, [])
  );

  // ==========================================================
  // PULL TO REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await fetchOrders(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================================
  // OPEN ORDER TRACKING
  // ==========================================================

  const openOrderTracking = (
    order
  ) => {
    navigation.navigate(
      "OrderTracking",
      {
        order,
      }
    );
  };

  // ==========================================================
  // GET ORDER ID
  // ==========================================================

  const getOrderId = (order) => {
    return String(
      order?.id ??
        order?.order_id ??
        order?._id ??
        ""
    );
  };

  // ==========================================================
  // GET CHEF
  // ==========================================================

  const getChef = (order) => {
    return (
      order?.chef ??
      order?.cook ??
      order?.kitchen_owner ??
      {}
    );
  };

  // ==========================================================
  // GET CHEF NAME
  // ==========================================================

  const getChefName = (order) => {
    const chef = getChef(order);

    return (
      chef?.name ??
      chef?.full_name ??
      order?.chef_name ??
      order?.cook_name ??
      "Home Chef"
    );
  };

  // ==========================================================
  // GET CHEF IMAGE
  // ==========================================================

  const getChefImage = (order) => {
    const chef = getChef(order);

    const image =
      chef?.image ??
      chef?.profile_photo ??
      chef?.profile_image ??
      chef?.photo ??
      order?.chef_image ??
      "";

    if (!image) {
      return null;
    }

    const imageString =
      String(image);

    if (
      imageString.startsWith(
        "http://"
      ) ||
      imageString.startsWith(
        "https://"
      )
    ) {
      return imageString;
    }

    return `${BASE_URL}/${imageString.replace(
      /^\/+/,
      ""
    )}`;
  };

  // ==========================================================
  // GET STATUS
  // ==========================================================

  const getOrderStatus = (
    order
  ) => {
    return (
      order?.status ??
      order?.order_status ??
      ""
    );
  };

  // ==========================================================
  // NORMALIZE STATUS
  // ==========================================================

  const normalizeStatus = (
    status
  ) => {
    return String(status)
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  };

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  const getStatusLabel = (
    status
  ) => {
    const normalized =
      normalizeStatus(status);

    const labels = {
      pending: "Pending",

      confirmed: "Confirmed",

      preparing: "Preparing",

      ready: "Ready",

      out_for_delivery:
        "Out for Delivery",

      outfordelivery:
        "Out for Delivery",

      delivered: "Delivered",

      cancelled: "Cancelled",

      canceled: "Cancelled",
    };

    return (
      labels[normalized] ||
      status ||
      "Pending"
    );
  };

  // ==========================================================
  // STATUS COLOR
  // ==========================================================

  const getStatusColor = (
    status
  ) => {
    const normalized =
      normalizeStatus(status);

    if (
      normalized ===
      "delivered"
    ) {
      return COLORS.green;
    }

    if (
      normalized ===
        "out_for_delivery" ||
      normalized ===
        "outfordelivery"
    ) {
      return COLORS.orange;
    }

    if (
      normalized ===
        "cancelled" ||
      normalized ===
        "canceled"
    ) {
      return COLORS.destructive;
    }

    return COLORS.gold;
  };

  // ==========================================================
  // GET ORDER ITEMS
  // ==========================================================

  const getOrderItems = (
    order
  ) => {
    if (
      Array.isArray(
        order?.items
      )
    ) {
      return order.items;
    }

    if (
      Array.isArray(
        order?.order_items
      )
    ) {
      return order.order_items;
    }

    if (
      Array.isArray(
        order?.cart_items
      )
    ) {
      return order.cart_items;
    }

    return [];
  };

  // ==========================================================
  // GET DISH NAME
  // ==========================================================

  const getDishName = (
    item
  ) => {
    const dish =
      item?.dish ??
      item?.food ??
      item?.food_item ??
      {};

    return (
      dish?.name ??
      dish?.food_name ??
      dish?.dish_name ??
      item?.name ??
      item?.food_name ??
      "Item"
    );
  };

  // ==========================================================
  // GET QUANTITY
  // ==========================================================

  const getQuantity = (
    item
  ) => {
    return (
      item?.quantity ??
      item?.qty ??
      1
    );
  };

  // ==========================================================
  // GET TOTAL
  // ==========================================================

  const getTotal = (
    order
  ) => {
    const total =
      order?.total_amount ??
      order?.total ??
      order?.grand_total ??
      order?.amount ??
      0;

    const numericTotal =
      Number(total);

    if (
      Number.isNaN(
        numericTotal
      )
    ) {
      return "0";
    }

    return numericTotal.toFixed(
      2
    );
  };

  // ==========================================================
  // FALLBACK CHEF IMAGE
  // ==========================================================

  const ChefImage = ({
    order,
  }) => {
    const image =
      getChefImage(order);

    if (image) {
      return (
        <Image
          source={{
            uri: image,
          }}
          style={styles.chefImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={[
          styles.chefImage,
          styles.chefImagePlaceholder,
        ]}
      >
        <Ionicons
          name="person"
          size={24}
          color="#888888"
        />
      </View>
    );
  };

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const StatusBadge = ({
    status,
  }) => {
    const color =
      getStatusColor(status);

    return (
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              `${color}1F`,
          },
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            {
              color,
            },
          ]}
        >
          {getStatusLabel(
            status
          )}
        </Text>
      </View>
    );
  };

  // ==========================================================
  // ORDER CARD
  // ==========================================================

  const renderOrder = ({
    item: order,
  }) => {
    const orderId =
      getOrderId(order);

    const chefName =
      getChefName(order);

    const status =
      getOrderStatus(order);

    const items =
      getOrderItems(order);

    const isDelivered =
      normalizeStatus(
        status
      ) === "delivered";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          openOrderTracking(
            order
          )
        }
        style={[
          styles.orderCard,
          {
            backgroundColor:
              isDark
                ? COLORS.darkCard
                : COLORS.card,

            borderColor:
              isDark
                ? "rgba(255,193,7,0.12)"
                : "rgba(255,193,7,0.15)",
          },
        ]}
      >
        {/* ==================================================
            TOP ROW
        ================================================== */}

        <View style={styles.topRow}>
          {/* Chef Image */}

          <ChefImage
            order={order}
          />

          {/* Chef Information */}

          <View
            style={
              styles.chefInfo
            }
          >
            <Text
              style={[
                styles.chefName,
                {
                  color: isDark
                    ? COLORS.darkForeground
                    : COLORS.foreground,
                },
              ]}
              numberOfLines={1}
            >
              {chefName}
            </Text>

            <Text
              style={[
                styles.orderId,
                {
                  color:
                    COLORS.mutedForeground,
                },
              ]}
              numberOfLines={1}
            >
              Order #
              {orderId.toUpperCase()}
            </Text>
          </View>

          {/* Status */}

          <StatusBadge
            status={status}
          />
        </View>

        {/* ==================================================
            ITEMS
        ================================================== */}

        {items.length > 0 && (
          <View
            style={styles.itemsContainer}
          >
            {items.map(
              (
                item,
                index
              ) => (
                <View
                  key={`${getDishName(
                    item
                  )}-${index}`}
                  style={[
                    styles.itemChip,
                    {
                      backgroundColor:
                        isDark
                          ? COLORS.darkMuted
                          : COLORS.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemChipText,
                      {
                        color:
                          isDark
                            ? COLORS.darkForeground
                            : COLORS.foreground,
                      },
                    ]}
                    numberOfLines={
                      1
                    }
                  >
                    {getDishName(
                      item
                    )}{" "}
                    x
                    {getQuantity(
                      item
                    )}
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        {/* ==================================================
            BOTTOM ROW
        ================================================== */}

        <View
          style={
            styles.bottomRow
          }
        >
          {/* Total */}

          <Text
            style={styles.totalAmount}
          >
            ₹{getTotal(order)}
          </Text>

          {/* Track / Reorder */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              openOrderTracking(
                order
              )
            }
            style={
              styles.trackButton
            }
          >
            <Text
              style={
                styles.trackButtonText
              }
            >
              {isDelivered
                ? "Reorder"
                : "Track Order"}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                COLORS.orange
              }
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // KEY EXTRACTOR
  // ==========================================================

  const keyExtractor = (
    item,
    index
  ) => {
    return (
      getOrderId(item) ||
      String(index)
    );
  };

  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              isDark
                ? COLORS.darkBackground
                : COLORS.background,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
        />

        {/* Header */}

        <View
          style={[
            styles.header,
            {
              backgroundColor:
                isDark
                  ? COLORS.darkCard
                  : COLORS.card,

              borderBottomColor:
                isDark
                  ? COLORS.darkBorder
                  : COLORS.border,
            },
          ]}
        >
          <TouchableOpacity
            style={
              styles.headerBackButton
            }
            onPress={() =>
              navigation?.goBack?.()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground
              }
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground,
              },
            ]}
          >
            My Orders
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={COLORS.orange}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground,
              },
            ]}
          >
            Loading your orders...
          </Text>
        </View>
      </View>
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (orders.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              isDark
                ? COLORS.darkBackground
                : COLORS.background,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
        />

        {/* Header */}

        <View
          style={[
            styles.header,
            {
              backgroundColor:
                isDark
                  ? COLORS.darkCard
                  : COLORS.card,

              borderBottomColor:
                isDark
                  ? COLORS.darkBorder
                  : COLORS.border,
            },
          ]}
        >
          <TouchableOpacity
            style={
              styles.headerBackButton
            }
            onPress={() =>
              navigation?.goBack?.()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground
              }
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground,
              },
            ]}
          >
            My Orders
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {/* Empty */}

        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={styles.emptyEmoji}
          >
            📦
          </Text>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground,
              },
            ]}
          >
            No orders yet
          </Text>

          <Text
            style={[
              styles.emptySubtitle,
              {
                color:
                  COLORS.mutedForeground,
              },
            ]}
          >
            Your completed orders
            will appear here.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRefresh}
            style={
              styles.refreshButton
            }
          >
            <Ionicons
              name="refresh"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.refreshButtonText
              }
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            isDark
              ? COLORS.darkBackground
              : COLORS.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
      />

      {/* ====================================================
          APP BAR
      ==================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              isDark
                ? COLORS.darkCard
                : COLORS.card,

            borderBottomColor:
              isDark
                ? COLORS.darkBorder
                : COLORS.border,
          },
        ]}
      >
        <TouchableOpacity
          style={
            styles.headerBackButton
          }
          onPress={() =>
            navigation?.goBack?.()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={
              isDark
                ? COLORS.darkForeground
                : COLORS.foreground
            }
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: isDark
                ? COLORS.darkForeground
                : COLORS.foreground,
            },
          ]}
        >
          My Orders
        </Text>

        <TouchableOpacity
          style={
            styles.headerRefreshButton
          }
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={23}
            color={COLORS.orange}
          />
        </TouchableOpacity>
      </View>

      {/* ====================================================
          ORDER LIST
      ==================================================== */}

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={
          keyExtractor
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isRefreshing
            }
            onRefresh={
              handleRefresh
            }
            colors={[
              COLORS.orange,
            ]}
            tintColor={
              COLORS.orange
            }
          />
        }
      />
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    minHeight: 64,

    paddingHorizontal: 16,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth: 1,
  },

  headerBackButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    alignItems: "center",

    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    fontSize: 20,

    fontWeight: "700",

    marginLeft: 6,
  },

  headerRefreshButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    alignItems: "center",

    justifyContent: "center",
  },

  headerSpacer: {
    width: 42,
  },

  // ==========================================================
  // LIST
  // ==========================================================

  listContent: {
    padding: 16,

    paddingBottom: 30,
  },

  // ==========================================================
  // ORDER CARD
  // ==========================================================

  orderCard: {
    padding: 14,

    marginBottom: 12,

    borderRadius: 20,

    borderWidth: 1,

    // iOS
    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.05,

    shadowRadius: 12,

    // Android
    elevation: 2,
  },

  // ==========================================================
  // TOP ROW
  // ==========================================================

  topRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  chefImage: {
    width: 48,

    height: 48,

    borderRadius: 24,
  },

  chefImagePlaceholder: {
    backgroundColor: "#E5E5E5",

    alignItems: "center",

    justifyContent: "center",
  },

  chefInfo: {
    flex: 1,

    marginLeft: 12,

    marginRight: 8,
  },

  chefName: {
    fontSize: 14,

    fontWeight: "600",

    marginBottom: 4,
  },

  orderId: {
    fontSize: 12,
  },

  // ==========================================================
  // STATUS
  // ==========================================================

  statusBadge: {
    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 20,

    alignSelf: "flex-start",
  },

  statusBadgeText: {
    fontSize: 11,

    fontWeight: "600",
  },

  // ==========================================================
  // ITEMS
  // ==========================================================

  itemsContainer: {
    flexDirection: "row",

    flexWrap: "wrap",

    marginTop: 12,

    gap: 6,
  },

  itemChip: {
    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 20,

    maxWidth: "100%",
  },

  itemChipText: {
    fontSize: 12,

    lineHeight: 17,
  },

  // ==========================================================
  // BOTTOM ROW
  // ==========================================================

  bottomRow: {
    marginTop: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  totalAmount: {
    fontSize: 16,

    fontWeight: "700",

    color: COLORS.orange,
  },

  trackButton: {
    minHeight: 34,

    paddingHorizontal: 12,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: COLORS.orange,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  trackButtonText: {
    fontSize: 12,

    fontWeight: "600",

    color: COLORS.orange,

    marginRight: 3,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingText: {
    marginTop: 14,

    fontSize: 15,

    fontWeight: "500",
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 56,

    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: "700",

    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,

    textAlign: "center",

    marginBottom: 20,
  },

  refreshButton: {
    height: 44,

    paddingHorizontal: 22,

    borderRadius: 22,

    backgroundColor: COLORS.orange,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  refreshButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "600",

    marginLeft: 7,
  },
});

export default OrderHistoryScreen;