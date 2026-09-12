import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// GLOBAL THEME
// ============================================================

import { useApp } from "./_layout";

// ============================================================
// PRIVACY POLICY SCREEN
// ============================================================

const PrivacyPolicyScreen = () => {
  // ==========================================================
  // EXPO ROUTER
  // ==========================================================

  const router = useRouter();

  // ==========================================================
  // GLOBAL APP THEME
  // ==========================================================

  const { isDarkMode, colors } = useApp();

  // ==========================================================
  // GO BACK
  // ==========================================================

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if this screen was opened directly
      router.replace("/Profile_screen");
    }
  };

  // ==========================================================
  // POLICY SECTIONS
  // ==========================================================

  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We may collect personal information such as your name, email address, phone number, delivery address, and payment details when you use the app.",
    },

    {
      title: "2. How We Use Your Information",
      content:
        "Your information is used to process orders, improve your app experience, provide customer support, and send important updates related to your account or orders.",
    },

    {
      title: "3. Sharing of Information",
      content:
        "We do not sell your personal information. Your data may only be shared with trusted service providers required for order delivery and payment processing.",
    },

    {
      title: "4. Data Security",
      content:
        "We use secure technologies and industry-standard practices to protect your personal information from unauthorized access, disclosure, alteration, or misuse.",
    },

    {
      title: "5. Cookies & Analytics",
      content:
        "The app may use cookies and analytics tools to improve performance, personalize content, and better understand user behavior.",
    },

    {
      title: "6. Your Rights",
      content:
        "You may request access, correction, or deletion of your personal information by contacting our support team.",
    },

    {
      title: "7. Changes to This Policy",
      content:
        "We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated revision date.",
    },

    {
      title: "8. Contact Us",
      content:
        "If you have any questions regarding this Privacy Policy, please contact our support team through the Help & Support section of the app.",
    },
  ];

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
      {/* ======================================================
          STATUS BAR
      ====================================================== */}

      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={colors.background}
      />

      {/* ======================================================
          APP BAR
      ====================================================== */}

      <View
        style={[
          styles.appBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* BACK BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goBack}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.muted,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={colors.foreground}
          />
        </TouchableOpacity>

        {/* TITLE */}

        <Text
          style={[
            styles.appBarTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Privacy Policy
        </Text>

        {/* HEADER SPACER */}

        <View style={styles.headerSpacer} />
      </View>

      {/* ======================================================
          BODY
      ====================================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================
            POLICY CARD
        ==================================================== */}

        <View
          style={[
            styles.policyCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {/* ==================================================
              POLICY TITLE
          ================================================== */}

          <Text
            style={[
              styles.policyTitle,
              {
                color: colors.foreground,
              },
            ]}
          >
            Privacy Policy
          </Text>

          {/* ==================================================
              LAST UPDATED
          ================================================== */}

          <Text
            style={[
              styles.lastUpdated,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            Last Updated: May 2026
          </Text>

          {/* ==================================================
              POLICY INTRODUCTION
          ================================================== */}

          <Text
            style={[
              styles.introduction,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            At HomeCookt, we respect your privacy and
            are committed to protecting your personal
            information. This Privacy Policy explains
            how we collect, use, and protect information
            when you use the HomeCookt application.
          </Text>

          {/* ==================================================
              POLICY SECTIONS
          ================================================== */}

          {sections.map((section, index) => (
            <View
              key={`${section.title}-${index}`}
              style={[
                styles.section,
                index === sections.length - 1 &&
                  styles.lastSection,
              ]}
            >
              {/* SECTION TITLE */}

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.foreground,
                  },
                ]}
              >
                {section.title}
              </Text>

              {/* SECTION CONTENT */}

              <Text
                style={[
                  styles.sectionContent,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {section.content}
              </Text>
            </View>
          ))}
        </View>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <View
          style={[
            styles.footerCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color={colors.gold}
          />

          <Text
            style={[
              styles.footerTitle,
              {
                color: colors.foreground,
              },
            ]}
          >
            Your Privacy Matters
          </Text>

          <Text
            style={[
              styles.footerText,
              {
                color: colors.mutedForeground,
              },
            ]}
          >
            We are committed to keeping your
            information safe and secure.
          </Text>
        </View>

        {/* BOTTOM SPACING */}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    flex: 1,
  },

  // ==========================================================
  // SCROLL VIEW
  // ==========================================================

  scrollView: {
    flex: 1,
  },

  // ==========================================================
  // APP BAR
  // ==========================================================

  appBar: {
    height: 60,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 21,
  },

  appBarTitle: {
    flex: 1,

    fontSize: 18,

    fontWeight: "700",

    marginLeft: 4,
  },

  headerSpacer: {
    width: 42,
  },

  // ==========================================================
  // SCROLL CONTENT
  // ==========================================================

  scrollContent: {
    paddingHorizontal: 16,

    paddingTop: 16,

    paddingBottom: 30,
  },

  // ==========================================================
  // POLICY CARD
  // ==========================================================

  policyCard: {
    padding: 20,

    borderRadius: 20,

    borderWidth: 1,
  },

  // ==========================================================
  // POLICY TITLE
  // ==========================================================

  policyTitle: {
    fontSize: 24,

    fontWeight: "700",

    marginBottom: 8,
  },

  // ==========================================================
  // LAST UPDATED
  // ==========================================================

  lastUpdated: {
    fontSize: 13,

    marginBottom: 18,
  },

  // ==========================================================
  // INTRODUCTION
  // ==========================================================

  introduction: {
    fontSize: 14,

    lineHeight: 22,

    marginBottom: 24,
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    marginBottom: 22,
  },

  lastSection: {
    marginBottom: 0,
  },

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  sectionTitle: {
    fontSize: 16,

    fontWeight: "700",

    marginBottom: 8,

    lineHeight: 22,
  },

  // ==========================================================
  // SECTION CONTENT
  // ==========================================================

  sectionContent: {
    fontSize: 14,

    lineHeight: 22,
  },

  // ==========================================================
  // FOOTER CARD
  // ==========================================================

  footerCard: {
    marginTop: 16,

    padding: 20,

    borderRadius: 20,

    borderWidth: 1,

    alignItems: "center",
  },

  footerTitle: {
    fontSize: 17,

    fontWeight: "700",

    marginTop: 10,

    marginBottom: 6,
  },

  footerText: {
    fontSize: 13,

    lineHeight: 20,

    textAlign: "center",
  },

  // ==========================================================
  // BOTTOM SPACING
  // ==========================================================

  bottomSpacing: {
    height: 20,
  },
});

export default PrivacyPolicyScreen;