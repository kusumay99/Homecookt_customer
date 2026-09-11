import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Screens
import CartScreen from "./Cart_screen";
import HomeScreen from "./Home_screen";
import ProfileScreen from "./Profile_screen";
import SearchScreen from "./Search_screen";

// ============================================================
// COLORS
// ============================================================

const AppColors = {
  orange: "#FF8A00",
  gold: "#FFC107",
  destructive: "#EF4444",

  background: "#F8F8F8",
  darkBackground: "#111111",

  card: "#FFFFFF",
  darkCard: "#1E1E1E",

  mutedForeground: "#8A8A8A",
};

// ============================================================
// MAIN SHELL
// ============================================================

const MainShell = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Change this according to your existing theme provider/storage.
  const [isDark, setIsDark] = useState(false);

  // Cart count
  const [cartCount, setCartCount] = useState(0);

  // ============================================================
  // LOAD CART COUNT
  // ============================================================

  const loadCartCount = async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await fetch(
        "https://api.homecookt.com/api/v1/cart/count",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        setCartCount(0);
        return;
      }

      const data = await response.json();

      // Supports multiple possible backend response formats
      const count =
        data?.count ??
        data?.cart_count ??
        data?.total_count ??
        data?.items_count ??
        0;

      setCartCount(Number(count) || 0);
    } catch (error) {
      console.log("Cart count error:", error);
      setCartCount(0);
    }
  };

  // ============================================================
  // GET ACCESS TOKEN
  // ============================================================

  const getAccessToken = async () => {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;

      return await AsyncStorage.getItem("access_token");
    } catch (error) {
      console.log("Token error:", error);
      return null;
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadCartCount();
  }, []);

  // ============================================================
  // TAB CHANGE
  // ============================================================

  const onTabChanged = async (index) => {
    setCurrentIndex(index);

    // Refresh cart count whenever Cart tab is opened
    if (index === 2) {
      await loadCartCount();
    }
  };

  // ============================================================
  // SCREENS
  // ============================================================

  const screens = [
    <HomeScreen key="home" />,
    <SearchScreen key="search" />,
    <CartScreen
      key="cart"
      onCartChanged={loadCartCount}
    />,
    <View key="saved" style={styles.placeholderScreen}>
      <Ionicons
        name="heart-outline"
        size={50}
        color={isDark ? "#FFFFFF" : AppColors.orange}
      />

      <Text
        style={[
          styles.placeholderText,
          {
            color: isDark ? "#FFFFFF" : "#222222",
          },
        ]}
      >
        Saved
      </Text>
    </View>,
    <ProfileScreen key="profile" />,
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? AppColors.darkBackground
            : AppColors.background,
        },
      ]}
    >
      {/* ======================================================
          SCREEN AREA
      ====================================================== */}

      <View style={styles.screenContainer}>
        {screens.map((screen, index) => (
          <View
            key={index}
            style={[
              styles.screen,
              {
                display: currentIndex === index ? "flex" : "none",
              },
            ]}
          >
            {screen}
          </View>
        ))}
      </View>

      {/* ======================================================
          BOTTOM NAVIGATION
      ====================================================== */}

      <SafeAreaView
        edges={["bottom"]}
        style={styles.bottomSafeArea}
      >
        <View style={styles.bottomPadding}>
          <View
            style={[
              styles.bottomNavigation,
              {
                backgroundColor: isDark
                  ? "rgba(30,30,30,0.95)"
                  : "rgba(255,255,255,0.95)",

                borderColor: "rgba(255,138,0,0.15)",

                shadowColor: isDark
                  ? "#000000"
                  : AppColors.orange,
              },
            ]}
          >
            {/* HOME */}
            <NavItem
              index={0}
              currentIndex={currentIndex}
              icon="home-outline"
              activeIcon="home"
              label="Home"
              onTap={onTabChanged}
            />

            {/* SEARCH */}
            <NavItem
              index={1}
              currentIndex={currentIndex}
              icon="search-outline"
              activeIcon="search"
              label="Search"
              onTap={onTabChanged}
            />

            {/* CART */}
            <CartNavItem
              index={2}
              currentIndex={currentIndex}
              cartCount={cartCount}
              onTap={onTabChanged}
            />

            {/* SAVED */}
            <NavItem
              index={3}
              currentIndex={currentIndex}
              icon="heart-outline"
              activeIcon="heart"
              label="Saved"
              onTap={onTabChanged}
            />

            {/* PROFILE */}
            <NavItem
              index={4}
              currentIndex={currentIndex}
              icon="person-outline"
              activeIcon="person"
              label="Profile"
              onTap={onTabChanged}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ============================================================
// NAV ITEM
// ============================================================

const NavItem = ({
  index,
  currentIndex,
  icon,
  activeIcon,
  label,
  onTap,
}) => {
  const isActive = currentIndex === index;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onTap(index)}
      style={styles.navTouchable}
    >
      {isActive ? (
        <LinearGradient
          colors={[AppColors.orange, AppColors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeNavItem}
        >
          <Ionicons
            name={activeIcon}
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.activeLabel}>
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveNavItem}>
          <Ionicons
            name={icon}
            size={22}
            color={AppColors.mutedForeground}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================
// CART NAV ITEM
// ============================================================

const CartNavItem = ({
  index,
  currentIndex,
  cartCount,
  onTap,
}) => {
  const isActive = currentIndex === index;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onTap(index)}
      style={styles.navTouchable}
    >
      {isActive ? (
        <LinearGradient
          colors={[AppColors.orange, AppColors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeNavItem}
        >
          <View style={styles.cartIconWrapper}>
            <Ionicons
              name="cart"
              size={20}
              color="#FFFFFF"
            />

            {cartCount > 0 && (
              <CartBadge count={cartCount} />
            )}
          </View>

          <Text style={styles.activeLabel}>
            Cart
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveNavItem}>
          <View style={styles.cartIconWrapper}>
            <Ionicons
              name="cart-outline"
              size={22}
              color={AppColors.mutedForeground}
            />

            {cartCount > 0 && (
              <CartBadge count={cartCount} />
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================
// CART BADGE
// ============================================================

const CartBadge = ({ count }) => {
  return (
    <View style={styles.cartBadge}>
      <Text style={styles.cartBadgeText}>
        {count > 9 ? "9+" : String(count)}
      </Text>
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

  screenContainer: {
    flex: 1,
  },

  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // ==========================================================
  // BOTTOM NAVIGATION
  // ==========================================================

  bottomSafeArea: {
    backgroundColor: "transparent",
  },

  bottomPadding: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  bottomNavigation: {
    height: 68,

    borderRadius: 28,

    borderWidth: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-around",

    paddingHorizontal: 5,

    // iOS
    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.12,

    shadowRadius: 20,

    // Android
    elevation: 10,
  },

  // ==========================================================
  // NAV ITEMS
  // ==========================================================

  navTouchable: {
    alignItems: "center",
    justifyContent: "center",
  },

  activeNavItem: {
    minWidth: 76,

    height: 44,

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  inactiveNavItem: {
    width: 48,

    height: 44,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 20,
  },

  activeLabel: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "600",

    marginLeft: 6,
  },

  // ==========================================================
  // CART
  // ==========================================================

  cartIconWrapper: {
    position: "relative",
  },

  cartBadge: {
    position: "absolute",

    top: -9,

    right: -9,

    width: 18,

    height: 18,

    borderRadius: 9,

    backgroundColor: AppColors.destructive,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderColor: "#FFFFFF",
  },

  cartBadgeText: {
    color: "#FFFFFF",

    fontSize: 9,

    fontWeight: "700",

    textAlign: "center",
  },

  // ==========================================================
  // SAVED PLACEHOLDER
  // ==========================================================

  placeholderScreen: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  placeholderText: {
    marginTop: 12,

    fontSize: 18,

    fontWeight: "600",
  },
});

export default MainShell;