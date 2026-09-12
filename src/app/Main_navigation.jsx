import { useRef, useState } from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import CartScreen from "./Cart_screen";
import HomeScreen from "./Home_screen";
import ProfileScreen from "./Profile_screen";

import { useApp } from "./_layout";

export default function MainNavigation() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ==========================================================
  // GLOBAL THEME
  // ==========================================================

  const { isDarkMode, colors } = useApp();

  // ==========================================================
  // CART REFRESH
  // ==========================================================

  const cartRef = useRef(null);

  // ==========================================================
  // TAB PRESS
  // ==========================================================

  const onItemTapped = (index) => {
    console.log("TAB PRESSED:", index);

    setSelectedIndex(index);

    // Refresh cart whenever Cart tab is selected
    if (index === 1) {
      setTimeout(() => {
        if (
          cartRef.current &&
          typeof cartRef.current.refreshCart === "function"
        ) {
          console.log("REFRESHING CART...");
          cartRef.current.refreshCart();
        }
      }, 100);
    }
  };

  // ==========================================================
  // RENDER SELECTED SCREEN
  // ==========================================================

  const renderScreen = () => {
    switch (selectedIndex) {
      case 0:
        return (
          <View
            style={[
              styles.screen,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <HomeScreen />
          </View>
        );

      case 1:
        return (
          <View
            style={[
              styles.screen,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <CartScreen ref={cartRef} />
          </View>
        );

      case 2:
        return (
          <View
            style={[
              styles.screen,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <ProfileScreen />
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.screen,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <HomeScreen />
          </View>
        );
    }
  };

  // ==========================================================
  // TAB BUTTON
  // ==========================================================

  const TabButton = ({
    index,
    label,
    inactiveIcon,
    activeIcon,
  }) => {
    const isActive = selectedIndex === index;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onItemTapped(index)}
        style={styles.tabButton}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{
          selected: isActive,
        }}
      >
        <Ionicons
          name={isActive ? activeIcon : inactiveIcon}
          size={25}
          color={
            isActive
              ? colors.orange
              : colors.mutedForeground
          }
        />

        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive
                ? colors.orange
                : colors.mutedForeground,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
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
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* ====================================================
          BODY
      ==================================================== */}

      <View
        style={[
          styles.body,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {renderScreen()}
      </View>

      {/* ====================================================
          BOTTOM NAVIGATION
      ==================================================== */}

      <View
        style={[
          styles.bottomNavigation,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        {/* HOME */}

        <TabButton
          index={0}
          label="Home"
          inactiveIcon="home-outline"
          activeIcon="home"
        />

        {/* CART */}

        <TabButton
          index={1}
          label="Cart"
          inactiveIcon="cart-outline"
          activeIcon="cart"
        />

        {/* PROFILE */}

        <TabButton
          index={2}
          label="Profile"
          inactiveIcon="person-outline"
          activeIcon="person"
        />
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  body: {
    flex: 1,
  },

  screen: {
    flex: 1,
  },

  bottomNavigation: {
    height: 68,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-around",

    borderTopWidth: 1,

    shadowOffset: {
      width: 0,
      height: -3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 8,

    elevation: 10,

    paddingBottom: 4,
  },

  tabButton: {
    flex: 1,

    height: 65,

    alignItems: "center",

    justifyContent: "center",
  },

  tabLabel: {
    marginTop: 3,

    fontSize: 11,

    fontWeight: "500",
  },
});