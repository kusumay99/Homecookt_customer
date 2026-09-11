import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

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

  muted: "#EEEEEE",
  darkMuted: "#2A2A2A",

  border: "#EEEEEE",
  darkBorder: "#333333",

  destructive: "#EF4444",
};

// ============================================================
// ORDER TRACKING SCREEN
// ============================================================

const OrderTrackingScreen = ({
  route,
  navigation,
}) => {
  // ==========================================================
  // GET ORDER FROM NAVIGATION
  // ==========================================================

  const order =
    route?.params?.order ?? {};

  // Change this later to your global theme context.
  const isDark = false;

  // ==========================================================
  // STEPS
  // ==========================================================

  const steps = [
    {
      icon: "📋",
      label: "Order Placed",
    },
    {
      icon: "👨‍🍳",
      label: "Preparing",
    },
    {
      icon: "✅",
      label: "Ready",
    },
    {
      icon: "🛵",
      label: "Out for Delivery",
    },
    {
      icon: "🏠",
      label: "Delivered",
    },
  ];

  // ==========================================================
  // GET STATUS
  // ==========================================================

  const getStatus = () => {
    return (
      order?.status ??
      order?.order_status ??
      "pending"
    );
  };

  const status = String(
    getStatus()
  ).toLowerCase();

  // ==========================================================
  // NORMALIZE STATUS
  // ==========================================================

  const normalizeStatus = (
    value
  ) => {
    return String(value)
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  };

  // ==========================================================
  // CURRENT STEP
  // ==========================================================

  const getCurrentStep = () => {
    // If backend already provides step, use it.
    if (
      order?.step !== undefined &&
      order?.step !== null
    ) {
      const step =
        Number(order.step);

      if (
        !Number.isNaN(step)
      ) {
        return Math.max(
          0,
          Math.min(
            step,
            steps.length - 1
          )
        );
      }
    }

    const normalized =
      normalizeStatus(status);

    switch (normalized) {
      case "pending":
      case "placed":
      case "order_placed":
        return 0;

      case "confirmed":
      case "preparing":
        return 1;

      case "ready":
        return 2;

      case "out_for_delivery":
      case "outfordelivery":
        return 3;

      case "delivered":
        return 4;

      default:
        return 0;
    }
  };

  const currentStep =
    getCurrentStep();

  // ==========================================================
  // STATUS DISPLAY
  // ==========================================================

  const getStatusTitle = () => {
    switch (
      normalizeStatus(status)
    ) {
      case "delivered":
        return "Delivered";

      case "out_for_delivery":
      case "outfordelivery":
        return "Out for Delivery";

      case "ready":
        return "Ready for Pickup";

      case "preparing":
        return "Preparing";

      case "confirmed":
        return "Order Confirmed";

      default:
        return "Order Placed";
    }
  };

  // ==========================================================
  // STATUS EMOJI
  // ==========================================================

  const getStatusEmoji = () => {
    switch (
      normalizeStatus(status)
    ) {
      case "delivered":
        return "🏠";

      case "out_for_delivery":
      case "outfordelivery":
        return "🛵";

      case "ready":
        return "✅";

      case "preparing":
        return "👨‍🍳";

      case "confirmed":
        return "📋";

      default:
        return "📋";
    }
  };

  // ==========================================================
  // ORDER ID
  // ==========================================================

  const orderId = String(
    order?.order_id ??
      order?.id ??
      order?._id ??
      ""
  );

  // ==========================================================
  // CHEF
  // ==========================================================

  const chef =
    order?.chef ??
    order?.cook ??
    {};

  const chefName =
    order?.chef_name ??
    chef?.name ??
    chef?.full_name ??
    "Home Chef";

  const chefImage =
    order?.chef_image ??
    chef?.image ??
    chef?.profile_photo ??
    chef?.profile_image ??
    chef?.photo ??
    "";

  // ==========================================================
  // IMAGE URL
  // ==========================================================

  const getImageUrl = (
    image
  ) => {
    if (
      !image ||
      String(image).trim() === ""
    ) {
      return null;
    }

    const imageString =
      String(image).trim();

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
  // CHEF PHONE
  // ==========================================================

  const chefPhone =
    order?.chef_phone ??
    order?.contact_number ??
    chef?.phone ??
    chef?.contact_number ??
    "";

  // ==========================================================
  // CALL CHEF
  // ==========================================================

  const callChef = async () => {
    if (!chefPhone) {
      Alert.alert(
        "Phone Number Unavailable",
        "The chef's phone number is not available."
      );

      return;
    }

    const phoneUrl =
      `tel:${chefPhone}`;

    try {
      const supported =
        await Linking.canOpenURL(
          phoneUrl
        );

      if (!supported) {
        Alert.alert(
          "Unable to Call",
          "Your device cannot make phone calls."
        );

        return;
      }

      await Linking.openURL(
        phoneUrl
      );
    } catch (error) {
      console.log(
        "Call error:",
        error
      );

      Alert.alert(
        "Unable to Call",
        "Could not open the phone application."
      );
    }
  };

  // ==========================================================
  // ESTIMATED DELIVERY
  // ==========================================================

  const estimatedDelivery =
    order?.estimated_delivery ??
    order?.estimatedDelivery ??
    "--";

  // ==========================================================
  // ORDER ITEMS
  // ==========================================================

  const items =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(
          order?.order_items
        )
      ? order.order_items
      : [];

  // ==========================================================
  // ITEM DISH
  // ==========================================================

  const getDish = (
    item
  ) => {
    return (
      item?.dish ??
      item?.food ??
      item?.food_item ??
      {}
    );
  };

  // ==========================================================
  // ITEM NAME
  // ==========================================================

  const getItemName = (
    item
  ) => {
    const dish =
      getDish(item);

    return (
      dish?.name ??
      dish?.food_name ??
      dish?.dish_name ??
      item?.dish_name ??
      item?.food_name ??
      item?.name ??
      "Food Item"
    );
  };

  // ==========================================================
  // ITEM IMAGE
  // ==========================================================

  const getItemImage = (
    item
  ) => {
    const dish =
      getDish(item);

    return (
      item?.food_image ??
      item?.image ??
      item?.image_url ??
      dish?.image ??
      dish?.image_url ??
      dish?.food_image ??
      dish?.image_urls?.[0] ??
      null
    );
  };

  // ==========================================================
  // ITEM QUANTITY
  // ==========================================================

  const getQuantity = (
    item
  ) => {
    const quantity =
      Number(
        item?.quantity ??
          item?.qty ??
          1
      );

    return Number.isNaN(
      quantity
    )
      ? 1
      : quantity;
  };

  // ==========================================================
  // ITEM PRICE
  // ==========================================================

  const getItemPrice = (
    item
  ) => {
    const dish =
      getDish(item);

    const price =
      item?.food_price ??
      item?.price ??
      dish?.price ??
      0;

    const numericPrice =
      Number(price);

    return Number.isNaN(
      numericPrice
    )
      ? 0
      : numericPrice;
  };

  // ==========================================================
  // TOTAL
  // ==========================================================

  const getTotal = () => {
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
      return "0.00";
    }

    return numericTotal.toFixed(
      2
    );
  };

  // ==========================================================
  // RENDER
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
          HEADER
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
          activeOpacity={0.7}
          onPress={() =>
            navigation.goBack()
          }
          style={
            styles.headerButton
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
          numberOfLines={1}
        >
          Order #
          {orderId.toUpperCase()}
        </Text>

        <View
          style={
            styles.headerButton
          }
        />
      </View>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ==================================================
            STATUS CARD
        ================================================== */}

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
            styles.statusCard
          }
        >
          <Text
            style={
              styles.statusEmoji
            }
          >
            {getStatusEmoji()}
          </Text>

          <Text
            style={
              styles.statusTitle
            }
          >
            {getStatusTitle()}
          </Text>

          <Text
            style={
              styles.statusText
            }
          >
            {status
              .replace(
                /_/g,
                " "
              )
              .replace(
                /\b\w/g,
                (letter) =>
                  letter.toUpperCase()
              )}
          </Text>

          <Text
            style={
              styles.estimatedText
            }
          >
            {normalizeStatus(
              status
            ) === "delivered"
              ? "Your order has been delivered!"
              : `Estimated: ${estimatedDelivery}`}
          </Text>
        </LinearGradient>

        {/* ==================================================
            PROGRESS STEPS
        ================================================== */}

        <View
          style={[
            styles.progressCard,
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
          {steps.map(
            (
              step,
              index
            ) => {
              const isCompleted =
                index <=
                currentStep;

              const isActive =
                index ===
                currentStep;

              return (
                <View
                  key={
                    step.label
                  }
                  style={
                    styles.stepRow
                  }
                >
                  {/* ----------------------------------------
                      LEFT SIDE
                  ---------------------------------------- */}

                  <View
                    style={
                      styles.stepLeft
                    }
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor:
                            isCompleted
                              ? "transparent"
                              : isDark
                              ? COLORS.darkMuted
                              : COLORS.muted,
                        },
                        isActive &&
                          styles.activeStepShadow,
                      ]}
                    >
                      {isCompleted ? (
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
                            styles.completedCircle
                          }
                        >
                          {index <
                          currentStep ? (
                            <Ionicons
                              name="checkmark"
                              size={
                                20
                              }
                              color="#FFFFFF"
                            />
                          ) : (
                            <Text
                              style={
                                styles.stepEmoji
                              }
                            >
                              {
                                step.icon
                              }
                            </Text>
                          )}
                        </LinearGradient>
                      ) : (
                        <Text
                          style={
                            styles.stepEmoji
                          }
                        >
                          {
                            step.icon
                          }
                        </Text>
                      )}
                    </View>

                    {/* Connector */}

                    {index <
                      steps.length -
                        1 && (
                      <View
                        style={[
                          styles.connector,
                          {
                            backgroundColor:
                              index <
                              currentStep
                                ? COLORS.orange
                                : isDark
                                ? COLORS.darkMuted
                                : COLORS.muted,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* ----------------------------------------
                      LABEL
                  ---------------------------------------- */}

                  <View
                    style={
                      styles.stepLabelContainer
                    }
                  >
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color:
                            isCompleted
                              ? isDark
                                ? COLORS.darkForeground
                                : COLORS.foreground
                              : COLORS.mutedForeground,

                          fontWeight:
                            isActive
                              ? "700"
                              : "400",
                        },
                      ]}
                    >
                      {step.label}
                    </Text>

                    {isActive && (
                      <Text
                        style={
                          styles.currentText
                        }
                      >
                        Current status
                      </Text>
                    )}
                  </View>
                </View>
              );
            }
          )}
        </View>

        {/* ==================================================
            CHEF INFORMATION
        ================================================== */}

        <View
          style={[
            styles.chefCard,
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
          {/* Chef image */}

          {getImageUrl(
            chefImage
          ) ? (
            <Image
              source={{
                uri: getImageUrl(
                  chefImage
                ),
              }}
              style={
                styles.chefImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.chefImage,
                styles.chefPlaceholder,
              ]}
            >
              <Ionicons
                name="person"
                size={25}
                color="#888888"
              />
            </View>
          )}

          {/* Chef details */}

          <View
            style={
              styles.chefDetails
            }
          >
            <Text
              style={
                styles.chefSmallLabel
              }
            >
              Your Chef
            </Text>

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
          </View>

          {/* Call button */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={callChef}
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
                y: 1,
              }}
              style={
                styles.callButton
              }
            >
              <Ionicons
                name="call"
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            ORDER ITEMS
        ================================================== */}

        <View
          style={[
            styles.itemsCard,
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
          {/* Title */}

          <Text
            style={[
              styles.itemsTitle,
              {
                color: isDark
                  ? COLORS.darkForeground
                  : COLORS.foreground,
              },
            ]}
          >
            Order Items
          </Text>

          {/* Items */}

          {items.length ===
          0 ? (
            <View
              style={
                styles.noItems
              }
            >
              <Ionicons
                name="fast-food-outline"
                size={30}
                color={
                  COLORS.mutedForeground
                }
              />

              <Text
                style={
                  styles.noItemsText
                }
              >
                No items found
              </Text>
            </View>
          ) : (
            items.map(
              (
                item,
                index
              ) => {
                const image =
                  getImageUrl(
                    getItemImage(
                      item
                    )
                  );

                const quantity =
                  getQuantity(
                    item
                  );

                const price =
                  getItemPrice(
                    item
                  );

                const itemTotal =
                  price *
                  quantity;

                return (
                  <View
                    key={`${getItemName(
                      item
                    )}-${index}`}
                    style={[
                      styles.orderItem,
                      index <
                        items.length -
                          1 &&
                        styles.orderItemBorder,
                    ]}
                  >
                    {/* Food image */}

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
                          styles.foodImage,
                          styles.foodPlaceholder,
                        ]}
                      >
                        <Ionicons
                          name="fast-food-outline"
                          size={
                            22
                          }
                          color="#888888"
                        />
                      </View>
                    )}

                    {/* Food name */}

                    <View
                      style={
                        styles.foodDetails
                      }
                    >
                      <Text
                        style={[
                          styles.foodName,
                          {
                            color:
                              isDark
                                ? COLORS.darkForeground
                                : COLORS.foreground,
                          },
                        ]}
                        numberOfLines={
                          2
                        }
                      >
                        {getItemName(
                          item
                        )}
                      </Text>

                      <Text
                        style={
                          styles.quantityText
                        }
                      >
                        x
                        {quantity}
                      </Text>
                    </View>

                    {/* Price */}

                    <Text
                      style={
                        styles.itemPrice
                      }
                    >
                      ₹
                      {itemTotal.toFixed(
                        2
                      )}
                    </Text>
                  </View>
                );
              }
            )
          )}

          {/* Divider */}

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  isDark
                    ? COLORS.darkBorder
                    : COLORS.border,
              },
            ]}
          />

          {/* Total */}

          <View
            style={
              styles.totalRow
            }
          >
            <Text
              style={[
                styles.totalLabel,
                {
                  color: isDark
                    ? COLORS.darkForeground
                    : COLORS.foreground,
                },
              ]}
            >
              Total
            </Text>

            <Text
              style={
                styles.totalAmount
              }
            >
              ₹{getTotal()}
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}

        <View
          style={{
            height: 80,
          }}
        />
      </ScrollView>
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

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    borderBottomWidth: 1,
  },

  headerButton: {
    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    textAlign: "center",

    fontSize: 19,

    fontWeight: "700",

    marginHorizontal: 5,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    padding: 16,

    paddingBottom: 40,
  },

  // ==========================================================
  // STATUS CARD
  // ==========================================================

  statusCard: {
    borderRadius: 20,

    padding: 20,

    alignItems: "center",

    shadowColor: COLORS.orange,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.35,

    shadowRadius: 16,

    elevation: 6,
  },

  statusEmoji: {
    fontSize: 48,

    marginBottom: 12,
  },

  statusTitle: {
    color: "#FFFFFF",

    fontSize: 22,

    fontWeight: "800",

    marginBottom: 4,
  },

  statusText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "600",

    textTransform: "capitalize",

    opacity: 0.95,

    marginBottom: 3,
  },

  estimatedText: {
    color: "rgba(255,255,255,0.9)",

    fontSize: 14,

    textAlign: "center",
  },

  // ==========================================================
  // PROGRESS
  // ==========================================================

  progressCard: {
    marginTop: 20,

    padding: 20,

    borderRadius: 20,

    borderWidth: 1,
  },

  stepRow: {
    flexDirection: "row",

    minHeight: 72,
  },

  stepLeft: {
    width: 40,

    alignItems: "center",
  },

  stepCircle: {
    width: 40,

    height: 40,

    borderRadius: 20,

    overflow: "visible",

    alignItems: "center",

    justifyContent: "center",
  },

  completedCircle: {
    width: 40,

    height: 40,

    borderRadius: 20,

    alignItems: "center",

    justifyContent: "center",
  },

  activeStepShadow: {
    shadowColor: COLORS.orange,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    shadowOpacity: 0.4,

    shadowRadius: 10,

    elevation: 5,
  },

  stepEmoji: {
    fontSize: 18,

    textAlign: "center",
  },

  connector: {
    width: 2,

    height: 32,

    marginTop: 0,
  },

  stepLabelContainer: {
    flex: 1,

    paddingTop: 8,

    paddingLeft: 16,
  },

  stepLabel: {
    fontSize: 14,

    lineHeight: 19,
  },

  currentText: {
    color: COLORS.orange,

    fontSize: 11,

    fontWeight: "500",

    marginTop: 3,
  },

  // ==========================================================
  // CHEF
  // ==========================================================

  chefCard: {
    marginTop: 16,

    padding: 14,

    borderRadius: 16,

    borderWidth: 1,

    flexDirection: "row",

    alignItems: "center",
  },

  chefImage: {
    width: 52,

    height: 52,

    borderRadius: 26,
  },

  chefPlaceholder: {
    backgroundColor: "#E5E5E5",

    alignItems: "center",

    justifyContent: "center",
  },

  chefDetails: {
    flex: 1,

    marginLeft: 12,

    marginRight: 10,
  },

  chefSmallLabel: {
    fontSize: 11,

    color: COLORS.mutedForeground,

    marginBottom: 3,
  },

  chefName: {
    fontSize: 15,

    fontWeight: "600",
  },

  callButton: {
    width: 42,

    height: 42,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  // ==========================================================
  // ORDER ITEMS
  // ==========================================================

  itemsCard: {
    marginTop: 16,

    padding: 16,

    borderRadius: 16,

    borderWidth: 1,
  },

  itemsTitle: {
    fontSize: 15,

    fontWeight: "700",

    marginBottom: 12,
  },

  orderItem: {
    minHeight: 60,

    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 8,
  },

  orderItemBorder: {
    borderBottomWidth: 0,
  },

  foodImage: {
    width: 44,

    height: 44,

    borderRadius: 10,
  },

  foodPlaceholder: {
    backgroundColor: "#E5E5E5",

    alignItems: "center",

    justifyContent: "center",
  },

  foodDetails: {
    flex: 1,

    marginLeft: 10,

    marginRight: 8,
  },

  foodName: {
    fontSize: 13,

    fontWeight: "500",

    lineHeight: 18,
  },

  quantityText: {
    fontSize: 12,

    color: COLORS.mutedForeground,

    marginTop: 3,
  },

  itemPrice: {
    fontSize: 13,

    fontWeight: "600",

    color: COLORS.orange,

    minWidth: 65,

    textAlign: "right",
  },

  divider: {
    height: 1,

    marginVertical: 12,
  },

  totalRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 15,

    fontWeight: "700",
  },

  totalAmount: {
    fontSize: 15,

    fontWeight: "700",

    color: COLORS.orange,
  },

  noItems: {
    alignItems: "center",

    paddingVertical: 20,
  },

  noItemsText: {
    marginTop: 8,

    fontSize: 13,

    color: COLORS.mutedForeground,
  },
});

export default OrderTrackingScreen;