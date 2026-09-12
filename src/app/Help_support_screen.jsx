import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";

import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "./_layout";

// ============================================================
// SUPPORT DETAILS
// ============================================================

const SUPPORT_PHONE = "+447462365503";
const SUPPORT_EMAIL = "homecookt.com@gmail.com";
const WHATSAPP_PHONE = "447462365503";

// ============================================================
// MAIN SCREEN
// ============================================================

const HelpSupportScreen = () => {
  const router = useRouter();

  // ==========================================================
  // GLOBAL THEME
  // ==========================================================

  const { isDarkMode, colors } = useApp();


  // ==========================================================
  // GO BACK
  // ==========================================================

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/Profile_screen");
    }
  };

  // ==========================================================
  // CALL SUPPORT
  // ==========================================================

  const callSupport = async () => {
    const phoneUrl = `tel:${SUPPORT_PHONE}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert(
          "Unable to make call",
          "Your device does not support phone calls."
        );
        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error("CALL SUPPORT ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to open the phone application."
      );
    }
  };

  // ==========================================================
  // EMAIL SUPPORT
  // ==========================================================

  const emailSupport = async () => {
    const subject = encodeURIComponent("HomeCookt Support");

    const body = encodeURIComponent(
      "Hello HomeCookt Support,\n\n" +
        "I need help with my HomeCookt account.\n\n" +
        "Thank you."
    );

    const emailUrl =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${subject}` +
      `&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(emailUrl);

      if (!supported) {
        Alert.alert(
          "Unable to open email",
          "No email application is available on this device."
        );
        return;
      }

      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error("EMAIL SUPPORT ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to open the email application."
      );
    }
  };

  // ==========================================================
  // WHATSAPP LIVE CHAT
  // ==========================================================

  const liveChat = async () => {
    const message = encodeURIComponent(
      "Hello HomeCookt Support"
    );

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;

    try {
      const supported =
        await Linking.canOpenURL(whatsappUrl);

      if (!supported) {
        Alert.alert(
          "WhatsApp unavailable",
          "WhatsApp is not installed or cannot be opened on this device."
        );
        return;
      }

      await Linking.openURL(whatsappUrl);
    } catch (error) {
      console.error("WHATSAPP ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to open WhatsApp."
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={colors.background}
      />

      {/* ====================================================
          HEADER
      ==================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Help & Support
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ==================================================
            HELP BANNER
        ================================================== */}

        <LinearGradient
          colors={[
            colors.orange,
            colors.gold,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.helpBanner}
        >
          <View style={styles.bannerIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={38}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.helpTitle}>
            Need Help?
          </Text>

          <Text style={styles.helpDescription}>
            We are here to help you with orders,
            kitchens, payments, and app support.
          </Text>
        </LinearGradient>

        {/* ==================================================
            QUICK SUPPORT
        ================================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Quick Support
        </Text>

        {/* CALL */}

        <SupportTile
          isDark={isDarkMode}
          colors={colors}
          icon="call-outline"
          title="Call Support"
          subtitle={SUPPORT_PHONE}
          onPress={callSupport}
        />

        {/* EMAIL */}

        <SupportTile
          isDark={isDarkMode}
          colors={colors}
          icon="mail-outline"
          title="Email Support"
          subtitle={SUPPORT_EMAIL}
          onPress={emailSupport}
        />

        {/* WHATSAPP */}

        <SupportTile
          isDark={isDarkMode}
          colors={colors}
          icon="logo-whatsapp"
          title="Live Chat"
          subtitle="Chat with our team on WhatsApp"
          onPress={liveChat}
        />

        {/* ==================================================
            FAQ
        ================================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Frequently Asked Questions
        </Text>

        <FaqTile
          isDark={isDarkMode}
          colors={colors}
          question="How can I place an order?"
          answer="Browse available dishes, select the food you want, add it to your cart, and proceed to checkout."
        />

        <FaqTile
          isDark={isDarkMode}
          colors={colors}
          question="How can I create a kitchen?"
          answer="If your account supports kitchen-owner features, open the My Kitchen section and select Create Kitchen."
        />

        <FaqTile
          isDark={isDarkMode}
          colors={colors}
          question="How do I track my order?"
          answer="Open Order History from your profile and select the order you want to track."
        />

        <FaqTile
          isDark={isDarkMode}
          colors={colors}
          question="How can I update my profile?"
          answer="Open your Profile, select Update Profile, make the required changes, and save them."
        />

        <FaqTile
          isDark={isDarkMode}
          colors={colors}
          question="What should I do if my order has a problem?"
          answer="Please contact HomeCookt Support by phone, email, or WhatsApp and provide your order details."
        />

        {/* ==================================================
            SUPPORT FOOTER
        ================================================== */}

        <View
          style={[
            styles.supportCard,
            {
              backgroundColor: colors.card,
            },
          ]}
        >
          <View
            style={[
              styles.supportIconContainer,
              {
                backgroundColor: isDarkMode
                  ? "rgba(249,115,22,0.15)"
                  : "rgba(249,115,22,0.10)",
              },
            ]}
          >
            <Ionicons
              name="headset-outline"
              size={40}
              color={colors.orange}
            />
          </View>

          <Text
            style={[
              styles.supportTitle,
              {
                color: colors.foreground,
              },
            ]}
          >
            HomeCookt Support
          </Text>

          <Text
            style={[
              styles.supportDescription,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            We usually respond within 24 hours.
          </Text>

          <Text
            style={[
              styles.supportContact,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            We are happy to help you.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// SUPPORT TILE
// ============================================================

const SupportTile = ({
  isDark,
  colors,
  icon,
  title,
  subtitle,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.supportTile,
        {
          backgroundColor: colors.card,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {/* ICON */}

      <View
        style={[
          styles.tileIconContainer,
          {
            backgroundColor: isDark
              ? "rgba(249,115,22,0.15)"
              : "rgba(249,115,22,0.10)",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={colors.orange}
        />
      </View>

      {/* TEXT */}

      <View style={styles.tileTextContainer}>
        <Text
          style={[
            styles.tileTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.tileSubtitle,
            {
              color: colors.mutedForeground,
            },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      {/* ARROW */}

      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color={colors.mutedForeground}
      />
    </TouchableOpacity>
  );
};

// ============================================================
// FAQ TILE
// ============================================================

const FaqTile = ({
  isDark,
  colors,
  question,
  answer,
}) => {
  const [expanded, setExpanded] =
    useState(false);

  return (
    <View
      style={[
        styles.faqCard,
        {
          backgroundColor: colors.card,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          setExpanded(
            (previous) => !previous
          )
        }
        style={styles.faqHeader}
        accessibilityRole="button"
        accessibilityLabel={question}
        accessibilityState={{
          expanded,
        }}
      >
        <Text
          style={[
            styles.faqQuestion,
            {
              color: colors.foreground,
            },
          ]}
        >
          {question}
        </Text>

        <Ionicons
          name={
            expanded
              ? "chevron-up-outline"
              : "chevron-down-outline"
          }
          size={21}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={styles.faqAnswerContainer}
        >
          <Text
            style={[
              styles.faqAnswer,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // SAFE AREA
  // ==========================================================

  safeArea: {
    flex: 1,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },

  headerSpacer: {
    width: 42,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // ==========================================================
  // SCROLL VIEW
  // ==========================================================

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // ==========================================================
  // HELP BANNER
  // ==========================================================

  helpBanner: {
    borderRadius: 24,
    padding: 20,
    minHeight: 185,
    justifyContent: "center",
    overflow: "hidden",
  },

  bannerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  helpTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },

  helpDescription: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "95%",
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 14,
  },

  // ==========================================================
  // SUPPORT TILE
  // ==========================================================

  supportTile: {
    minHeight: 78,
    borderRadius: 18,
    marginBottom: 12,
    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.04,
    shadowRadius: 4,

    elevation: 1,
  },

  tileIconContainer: {
    width: 48,
    height: 48,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,
  },

  tileTextContainer: {
    flex: 1,
    paddingVertical: 4,
  },

  tileTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  tileSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ==========================================================
  // FAQ
  // ==========================================================

  faqCard: {
    borderRadius: 16,
    marginBottom: 12,

    overflow: "hidden",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.03,
    shadowRadius: 3,

    elevation: 1,
  },

  faqHeader: {
    minHeight: 60,

    paddingHorizontal: 16,
    paddingVertical: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    paddingRight: 12,
    lineHeight: 21,
  },

  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
  },

  // ==========================================================
  // SUPPORT FOOTER
  // ==========================================================

  supportCard: {
    borderRadius: 20,
    padding: 22,

    marginTop: 12,

    alignItems: "center",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 1,
  },

  supportIconContainer: {
    width: 70,
    height: 70,

    borderRadius: 35,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,
  },

  supportTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  supportDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  supportContact: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  bottomSpace: {
    height: 20,
  },
});

export default HelpSupportScreen;