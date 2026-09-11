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

const COLORS = {
  orange: "#FF7A00",
  grey: "#888888",
  white: "#FFFFFF",
  black: "#111111",
  border: "#EEEEEE",
};

export default function MainNavigation() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reference to Cart screen so we can refresh it
  const cartRef = useRef(null);

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

  // Render selected screen
  const renderScreen = () => {
    switch (selectedIndex) {
      case 0:
        return (
          <View style={styles.screen}>
            <HomeScreen />
          </View>
        );

      case 1:
        return (
          <View style={styles.screen}>
            <CartScreen ref={cartRef} />
          </View>
        );

      case 2:
        return (
          <View style={styles.screen}>
            <ProfileScreen />
          </View>
        );

      default:
        return (
          <View style={styles.screen}>
            <HomeScreen />
          </View>
        );
    }
  };

  // Bottom navigation button
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
      >
        <Ionicons
          name={isActive ? activeIcon : inactiveIcon}
          size={25}
          color={isActive ? COLORS.orange : COLORS.grey}
        />

        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive
                ? COLORS.orange
                : COLORS.grey,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* ================= BODY ================= */}
      <View style={styles.body}>
        {renderScreen()}
      </View>

      {/* ================= BOTTOM NAVIGATION ================= */}
      <View style={styles.bottomNavigation}>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  body: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  bottomNavigation: {
    height: 68,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-around",

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