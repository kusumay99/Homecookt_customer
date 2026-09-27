import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
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

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#FF7A00",
  gold: "#FFB703",

  background1: "#FEF0E6",
  background2: "#FEF8F3",
  background3: "#FEFBEE",

  foreground: "#111111",
  muted: "#777777",

  white: "#FFFFFF",
  border: "#E5E5E5",

  inputBackground: "rgba(255,255,255,0.85)",
};

// ============================================================
// LOGIN SCREEN
// ============================================================

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ==========================================================
  // EMAIL VALIDATION
  // ==========================================================

  const validateEmail = (value) => {
    const cleanEmail = value.trim();

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm = () => {
    const emailValidation = validateEmail(email);

    let passwordValidation = "";

    if (!password.trim()) {
      passwordValidation = "Please enter your password.";
    }

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    return !emailValidation && !passwordValidation;
  };

  // ==========================================================
  // SAVE PROFILE DATA
  // ==========================================================

  const saveProfileData = async (profile) => {
    if (!profile) {
      return;
    }

    try {
      const profileName =
        profile?.name?.toString() ||
        profile?.full_name?.toString() ||
        "";

      const profileImage =
        profile?.profile_photo?.toString() ||
        profile?.image?.toString() ||
        "";

      const profileEmail =
        profile?.email?.toString() ||
        email.trim();

      const profileUserId =
        profile?.user_id?.toString() ||
        "";

      const roleValue = Array.isArray(profile?.roles)
        ? JSON.stringify(profile.roles)
        : profile?.primary_role?.toString() ||
          profile?.role?.toString() ||
          "";

      await AsyncStorage.multiSet([
        ["user", JSON.stringify(profile)],

        ["user_id", profileUserId],
        ["userid", profileUserId],

        ["name", profileName],
        ["email", profileEmail],
        ["image", profileImage],

        ["role", roleValue],

        [
          "profile_completed",
          profile?.profile_completed ? "true" : "false",
        ],

        [
          "onboarding_step",
          profile?.onboarding_step?.toString() || "",
        ],
      ]);
    } catch (error) {
      console.log("SAVE PROFILE ERROR:", error);
    }
  };

  // ==========================================================
  // GET USER PROFILE
  // ==========================================================

  const getUserProfile = async (token) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/users/profile`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      console.log(
        "PROFILE STATUS:",
        response.status
      );

      if (!response.ok) {
        console.log(
          "PROFILE ERROR:",
          data?.detail || data?.message || responseText
        );

        return null;
      }

      const profile = data?.profile || data;

      await saveProfileData(profile);

      return profile;
    } catch (error) {
      console.log("GET PROFILE ERROR:", error);
      return null;
    }
  };

  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const loginUser = async () => {
    if (loading) {
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/v1/users/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
          }),
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      console.log(
        "LOGIN STATUS:",
        response.status
      );

      if (!response.ok) {
        const errorMessage =
          data?.detail ||
          data?.message ||
          "Invalid email or password.";

        Alert.alert(
          "Login Failed",
          typeof errorMessage === "string"
            ? errorMessage
            : "Unable to login. Please check your credentials."
        );

        return;
      }

      // ======================================================
      // GET TOKENS
      // ======================================================

      const token =
        data?.access_token?.toString() || "";

      const refreshToken =
        data?.refresh_token?.toString() || "";

      const userId =
        data?.user_id?.toString() ||
        data?.user?.user_id?.toString() ||
        "";

      const loggedInEmail =
        data?.email?.toString() ||
        data?.user?.email?.toString() ||
        cleanEmail;

      // ======================================================
      // ACCESS TOKEN REQUIRED
      // ======================================================

      if (!token) {
        Alert.alert(
          "Login Failed",
          "Login was successful, but no access token was returned by the server."
        );

        return;
      }

      // ======================================================
      // SAVE LOGIN SESSION
      // ======================================================

      const storageData = [
        ["access_token", token],

        ["email", loggedInEmail],

        ["user_id", userId],
        ["userid", userId],

        ["role", ""],

        ["profile_completed", "false"],

        ["onboarding_step", ""],
      ];

      if (refreshToken) {
        storageData.push([
          "refresh_token",
          refreshToken,
        ]);
      }

      await AsyncStorage.multiSet(storageData);

      // ======================================================
      // GET COMPLETE PROFILE
      // ======================================================

      const profile = await getUserProfile(token);

      // ======================================================
      // NAVIGATE TO MAIN NAVIGATION
      // ======================================================

      router.replace("/Main_navigation");

      // ======================================================
      // CHECK PROFILE COMPLETION
      // ======================================================

      if (!profile?.profile_completed) {
        setTimeout(() => {
          Alert.alert(
            "Create Your Profile",
            "Your profile is incomplete. Please create your profile to continue.",
            [
              {
                text: "Create Profile",
                onPress: () => {
                  router.push("/Update_profile_screen");
                },
              },
            ],
            {
              cancelable: false,
            }
          );
        }, 700);
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // EMAIL CHANGE
  // ==========================================================

  const handleEmailChange = (value) => {
    setEmail(value);

    if (emailError) {
      setEmailError("");
    }
  };

  // ==========================================================
  // PASSWORD CHANGE
  // ==========================================================

  const handlePasswordChange = (value) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError("");
    }
  };

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  const handleForgotPassword = () => {
    router.push("/Forgot_password_screen");
  };

  // ==========================================================
  // REGISTER
  // ==========================================================

  const handleRegister = () => {
    router.push({
      pathname: "/Register_details_screen",
      params: {
        selectedRoles: JSON.stringify([]),
      },
    });
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background1}
      />

      <LinearGradient
        colors={[
          COLORS.background1,
          COLORS.background2,
          COLORS.background3,
        ]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ==================================================
                LOGO
            ================================================== */}

            <View style={styles.logoSection}>
              <LinearGradient
                colors={[
                  COLORS.orange,
                  COLORS.gold,
                ]}
                style={styles.logoOuter}
              >
                <View style={styles.logoInner}>
                  <Image
                    source={require("../../assets/images/home-cookt-logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>

              <Text style={styles.title}>
                Welcome Back
              </Text>

              <Text style={styles.subtitle}>
                Login to continue to HomeCookt
              </Text>
            </View>

            {/* ==================================================
                FORM CARD
            ================================================== */}

            <View style={styles.formCard}>
              {/* ==================================================
                  EMAIL
              ================================================== */}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email Address
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    emailError &&
                      styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={21}
                    color={
                      emailError
                        ? "#D32F2F"
                        : COLORS.orange
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    value={email}
                    onChangeText={
                      handleEmailChange
                    }
                    placeholder="Enter your email"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>

                {!!emailError && (
                  <Text style={styles.errorText}>
                    {emailError}
                  </Text>
                )}
              </View>

              {/* ==================================================
                  PASSWORD
              ================================================== */}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    passwordError &&
                      styles.inputWrapperError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color={
                      passwordError
                        ? "#D32F2F"
                        : COLORS.orange
                    }
                    style={styles.inputIcon}
                  />

                  <TextInput
                    value={password}
                    onChangeText={
                      handlePasswordChange
                    }
                    placeholder="Enter your password"
                    placeholderTextColor="#999999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={
                      loginUser
                    }
                    style={styles.input}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={loading}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={22}
                      color={COLORS.muted}
                    />
                  </TouchableOpacity>
                </View>

                {!!passwordError && (
                  <Text style={styles.errorText}>
                    {passwordError}
                  </Text>
                )}
              </View>

              {/* ==================================================
                  FORGOT PASSWORD
              ================================================== */}

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
                activeOpacity={0.7}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* ==================================================
                  LOGIN BUTTON
              ================================================== */}

              <TouchableOpacity
                onPress={loginUser}
                disabled={loading}
                activeOpacity={0.85}
                style={[
                  styles.loginButtonWrapper,
                  loading &&
                    styles.loginButtonDisabled,
                ]}
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
                    y: 0,
                  }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={COLORS.white}
                      />

                      <Text
                        style={
                          styles.loginButtonText
                        }
                      >
                        Logging In...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={
                          styles.loginButtonText
                        }
                      >
                        Login
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={21}
                        color={COLORS.white}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ==================================================
                  REGISTER
              ================================================== */}

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  Don't have an account?
                </Text>

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.registerLink
                    }
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <View style={styles.footer}>
              <View style={styles.footerLine} />

              <Text style={styles.footerText}>
                Fresh. Homemade. Delivered.
              </Text>

              <Text style={styles.footerCopyright}>
                © HomeCookt
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background1,
  },

  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 25,
  },

  // ==========================================================
  // LOGO
  // ==========================================================

  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  logoInner: {
    width: "100%",
    height: "100%",
    borderRadius: 54,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  logo: {
    width: 84,
    height: 84,
  },

  title: {
    marginTop: 20,
    fontSize: 29,
    fontWeight: "800",
    color: COLORS.foreground,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },

  // ==========================================================
  // FORM CARD
  // ==========================================================

  formCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,

    borderWidth: 1,
    borderColor: "rgba(229,229,229,0.8)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },

  // ==========================================================
  // INPUT
  // ==========================================================

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.foreground,
    marginBottom: 8,
  },

  inputWrapper: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
      COLORS.inputBackground,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 14,

    paddingHorizontal: 14,
  },

  inputWrapperError: {
    borderColor: "#D32F2F",
    borderWidth: 1.2,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",

    fontSize: 15,
    color: COLORS.foreground,

    paddingVertical: 0,
  },

  eyeButton: {
    width: 38,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 3,
  },

  // ==========================================================
  // FORGOT
  // ==========================================================

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -2,
    marginBottom: 22,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.orange,
  },

  // ==========================================================
  // LOGIN BUTTON
  // ==========================================================

  loginButtonWrapper: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",

    shadowColor: COLORS.orange,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButton: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  // ==========================================================
  // REGISTER
  // ==========================================================

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 23,
  },

  registerText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  registerLink: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 5,
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    alignItems: "center",
    marginTop: 28,
  },

  footerLine: {
    width: 55,
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginBottom: 10,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },

  footerCopyright: {
    fontSize: 11,
    color: "#999999",
    marginTop: 5,
  },
});