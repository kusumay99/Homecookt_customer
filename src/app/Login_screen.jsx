import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

const BASE_URL = "https://api.homecookt.com";

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

const LoginScreen = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [obscurePassword, setObscurePassword] = useState(true);

  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ============================================================
  // VALIDATE EMAIL
  // ============================================================

  const validateEmail = (value) => {
    if (!value || value.trim().length === 0) {
      return "Enter email";
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailRegex.test(value.trim())) {
      return "Enter valid email";
    }

    return "";
  };

  // ============================================================
  // VALIDATE PASSWORD
  // ============================================================

  const validatePassword = (value) => {
    if (!value || value.length === 0) {
      return "Enter password";
    }

    if (value.length < 6) {
      return "Minimum 6 characters";
    }

    return "";
  };

  // ============================================================
  // GET USER PROFILE
  // ============================================================

  const getUserProfile = async (token) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/users/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();

      console.log("PROFILE STATUS:", response.status);
      console.log("PROFILE RESPONSE:", text);

      if (response.status === 200) {
        let data = {};

        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.log("PROFILE JSON PARSE ERROR:", jsonError);
          return;
        }

        const profile = data?.profile;

        if (!profile) {
          console.log("Profile object not found");
          return;
        }

        // ======================================================
        // SAVE PROFILE DATA
        // ======================================================

        await AsyncStorage.setItem(
          "name",
          profile?.name || ""
        );

        await AsyncStorage.setItem(
          "image",
          profile?.profile_photo || ""
        );

        await AsyncStorage.setItem(
          "email",
          profile?.email || ""
        );

        // Save complete user object
        const userObject = {
          user_id: profile?.user_id || "",
          name: profile?.name || "",
          image: profile?.profile_photo || "",
          email: profile?.email || "",
          phone_number: profile?.phone_number || null,
          phone: profile?.phone || null,
          bio: profile?.bio || null,
          gender: profile?.gender || null,
          dob: profile?.dob || null,
          roles: profile?.roles || [],
          primary_role: profile?.primary_role || "",
          role_count: profile?.role_count || 0,
          is_verified: profile?.is_verified || false,
          is_blocked: profile?.is_blocked || false,
          profile_completed:
            profile?.profile_completed || false,
          onboarding_step:
            profile?.onboarding_step || 0,
          address_info:
            profile?.address_info || {},
          current_location:
            profile?.current_location || {},
          last_location:
            profile?.last_location || {},
          saved_addresses:
            profile?.saved_addresses || [],
          active_address_id:
            profile?.active_address_id || null,
          preferences:
            profile?.preferences || {},
          kitchen:
            profile?.kitchen || null,
          ratings_summary:
            profile?.ratings_summary || {},
          order_stats:
            profile?.order_stats || {},
          activity:
            profile?.activity || {},
          device_token:
            profile?.device_token || null,
        };

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(userObject)
        );

        console.log("PROFILE SAVED SUCCESSFULLY");

        return profile;
      } else {
        console.log(
          "PROFILE API FAILED:",
          response.status
        );

        return null;
      }
    } catch (error) {
      console.log("PROFILE ERROR:", error);
      return null;
    }
  };

  // ============================================================
  // LOGIN API
  // ============================================================

  const loginUser = async () => {
    // Hide keyboard
    Keyboard.dismiss();

    // Clear previous errors
    setEmailError("");
    setPasswordError("");

    // ============================================================
    // VALIDATION
    // ============================================================

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation) {
      setEmailError(emailValidation);
    }

    if (passwordValidation) {
      setPasswordError(passwordValidation);
    }

    if (emailValidation || passwordValidation) {
      return;
    }

    // ============================================================
    // START LOADING
    // ============================================================

    setIsLoading(true);

    try {
      console.log("LOGIN REQUEST STARTED");

      // ==========================================================
      // LOGIN REQUEST
      // ==========================================================

      const response = await fetch(
        `${BASE_URL}/api/v1/users/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
          }),
        }
      );

      const text = await response.text();

      console.log(
        "LOGIN STATUS:",
        response.status
      );

      console.log(
        "LOGIN RESPONSE:",
        text
      );

      // ==========================================================
      // PARSE RESPONSE
      // ==========================================================

      let data = {};

      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.log(
          "JSON PARSE ERROR:",
          jsonError
        );
      }

      // ==========================================================
      // LOGIN SUCCESS
      // ==========================================================

      if (response.status === 200) {
        // ======================================================
        // GET ACCESS TOKEN
        // ======================================================

        const token =
          data?.access_token?.toString() || "";

        // ======================================================
        // GET REFRESH TOKEN
        // ======================================================

        const refreshToken =
          data?.refresh_token?.toString() || "";

        // ======================================================
        // GET USER ID
        // ======================================================

        const userId =
          data?.user_id?.toString() || "";

        // ======================================================
        // GET EMAIL
        // ======================================================

        const loggedInEmail =
          data?.email?.toString() ||
          email.trim();

        console.log("LOGIN SUCCESS");
        console.log("USER ID:", userId);

        // ======================================================
        // CHECK ACCESS TOKEN
        // ======================================================

        if (!token) {
          Alert.alert(
            "Login Failed",
            "Access token was not received from the server."
          );

          return;
        }

        // ======================================================
        // SAVE ACCESS TOKEN
        // ======================================================

        await AsyncStorage.setItem(
          "access_token",
          token
        );

        // ======================================================
        // SAVE REFRESH TOKEN
        // ======================================================

        if (refreshToken) {
          await AsyncStorage.setItem(
            "refresh_token",
            refreshToken
          );
        }

        // ======================================================
        // SAVE USER ID
        // ======================================================

        if (userId) {
          await AsyncStorage.setItem(
            "user_id",
            userId
          );

          // Also save userid because some parts
          // of the app may use this key.
          await AsyncStorage.setItem(
            "userid",
            userId
          );
        }

        // ======================================================
        // SAVE EMAIL
        // ======================================================

        await AsyncStorage.setItem(
          "email",
          loggedInEmail
        );

        // ======================================================
        // SAVE ROLE
        // ======================================================

        if (data?.role) {
          await AsyncStorage.setItem(
            "role",
            JSON.stringify(data.role)
          );
        }

        // ======================================================
        // SAVE PROFILE COMPLETION STATUS
        // ======================================================

        await AsyncStorage.setItem(
          "profile_completed",
          String(
            data?.profile_completed || false
          )
        );

        // ======================================================
        // SAVE ONBOARDING STEP
        // ======================================================

        await AsyncStorage.setItem(
          "onboarding_step",
          String(
            data?.onboarding_step || 0
          )
        );

        // ======================================================
        // GET USER PROFILE
        // ======================================================

        await getUserProfile(token);

        // ======================================================
        // VERIFY STORAGE
        // ======================================================

        const savedUserId =
          await AsyncStorage.getItem(
            "user_id"
          );

        const savedEmail =
          await AsyncStorage.getItem(
            "email"
          );

        console.log(
          "SAVED USER ID:",
          savedUserId
        );

        console.log(
          "SAVED EMAIL:",
          savedEmail
        );

        // ======================================================
        // NAVIGATE TO MAIN APP
        // ======================================================
        //
        // IMPORTANT:
        // This is Expo Router.
        // Do NOT use navigation.reset().
        //
        // Your current route file is:
        //
        // src/app/Main_navigation.jsx
        //
        // Therefore the route is:
        //
        // /Main_navigation
        //
        // ======================================================

        router.replace("/Main_navigation");

        return;
      }

      // ============================================================
      // LOGIN FAILED
      // ============================================================

      let message =
        data?.message ||
        data?.detail ||
        "Login failed";

      if (response.status === 401) {
        message =
          data?.message ||
          data?.detail ||
          "Invalid email or password.";
      }

      Alert.alert(
        "Login Failed",
        message
      );
    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const forgotPassword = () => {
    if (isLoading) {
      return;
    }

    router.push("/Forgot_password_screen");
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = () => {
    if (isLoading) {
      return;
    }

    router.push({
      pathname: "/Register_details_screen",
      params: {
        selectedRoles: JSON.stringify([]),
      },
    });
  };

  // ============================================================
  // INPUT COMPONENT
  // ============================================================

  const Input = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    secureTextEntry,
    rightIcon,
    onRightIconPress,
    error,
    autoCapitalize = "none",
  }) => {
    return (
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            error ? styles.inputError : null,
          ]}
        >
          {/* LEFT ICON */}

          <Ionicons
            name={icon}
            size={21}
            color="#777777"
            style={styles.inputIcon}
          />

          {/* INPUT */}

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999999"
            value={value}
            onChangeText={(text) => {
              onChangeText(text);

              if (error) {
                if (placeholder === "Email") {
                  setEmailError("");
                }

                if (placeholder === "Password") {
                  setPasswordError("");
                }
              }
            }}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={!isLoading}
            returnKeyType={
              placeholder === "Email"
                ? "next"
                : "done"
            }
            onSubmitEditing={() => {
              if (placeholder === "Password") {
                loginUser();
              }
            }}
          />

          {/* RIGHT ICON */}

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={isLoading}
              style={styles.rightIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon}
                size={21}
                color="#777777"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ERROR */}

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <Pressable
          style={styles.flex}
          onPress={Keyboard.dismiss}
        >
          <LinearGradient
            colors={[
              COLORS.background1,
              COLORS.background2,
              COLORS.background3,
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.container}
          >
            <ScrollView
              contentContainerStyle={
                styles.scrollContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                {/* ================================================= */}
                {/* LOGO */}
                {/* ================================================= */}

                <LinearGradient
                  colors={[COLORS.orange, COLORS.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoOuter}
                >
                  <View style={styles.logoInner}>
                    <Image
                      source={require("../../assets/images/home-cookt-logo.png")}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>

                {/* ================================================= */}
                {/* TITLE */}
                {/* ================================================= */}

                <Text style={styles.title}>
                  Welcome Back
                </Text>

                {/* ================================================= */}
                {/* FORM CARD */}
                {/* ================================================= */}

                <View style={styles.formCard}>
                  {/* EMAIL */}

                  <Input
                    icon="mail-outline"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    error={emailError}
                  />

                  {/* PASSWORD */}

                  <Input
                    icon="lock-closed-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={
                      obscurePassword
                    }
                    rightIcon={
                      obscurePassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    onRightIconPress={() =>
                      setObscurePassword(
                        (previous) =>
                          !previous
                      )
                    }
                    error={passwordError}
                  />

                  {/* ================================================= */}
                  {/* FORGOT PASSWORD */}
                  {/* ================================================= */}

                  <View
                    style={
                      styles.forgotContainer
                    }
                  >
                    <TouchableOpacity
                      onPress={forgotPassword}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={styles.forgotText}
                      >
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* ================================================= */}
                  {/* LOGIN BUTTON */}
                  {/* ================================================= */}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={loginUser}
                    disabled={isLoading}
                    style={
                      styles.loginButtonWrapper
                    }
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
                      {isLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                        />
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

                  {/* ================================================= */}
                  {/* REGISTER */}
                  {/* ================================================= */}

                  <TouchableOpacity
                    onPress={register}
                    disabled={isLoading}
                    style={
                      styles.registerButton
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={styles.registerText}
                    >
                      Don't have an account?{" "}
                      <Text
                        style={
                          styles.registerHighlight
                        }
                      >
                        Sign Up
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // GENERAL
  // ==========================================================

  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background2,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },

  content: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // ==========================================================
  // LOGO
  // ==========================================================

  logoOuter: {
    width: 128,
    height: 128,
    borderRadius: 36,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    elevation: 7,
  },

  logoInner: {
    width: 114,
    height: 114,
    borderRadius: 32,

    backgroundColor: COLORS.white,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
  },

  logoImage: {
    width: 98,
    height: 98,
  },
  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    marginTop: 24,

    fontSize: 26,
    fontWeight: "800",

    color: COLORS.foreground,

    textAlign: "center",
  },

  // ==========================================================
  // FORM CARD
  // ==========================================================

  formCard: {
    width: "100%",

    marginTop: 32,

    padding: 24,

    borderRadius: 24,

    backgroundColor:
      "rgba(255,255,255,0.72)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.9)",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.08,

    shadowRadius: 20,

    elevation: 4,
  },

  // ==========================================================
  // INPUT
  // ==========================================================

  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },

  inputContainer: {
    width: "100%",
    height: 54,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
      COLORS.inputBackground,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 14,

    paddingHorizontal: 14,
  },

  inputError: {
    borderColor: "#E53935",
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

  rightIconButton: {
    width: 35,
    height: 45,

    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    marginTop: 5,
    marginLeft: 4,

    fontSize: 12,

    color: "#E53935",
  },

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  forgotContainer: {
    alignItems: "flex-end",

    marginTop: -4,

    marginBottom: 12,
  },

  forgotText: {
    color: COLORS.orange,

    fontSize: 14,

    fontWeight: "600",
  },

  // ==========================================================
  // LOGIN BUTTON
  // ==========================================================

  loginButtonWrapper: {
    width: "100%",

    borderRadius: 15,

    overflow: "hidden",

    marginTop: 4,
  },

  loginButton: {
    height: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,

    borderRadius: 15,
  },

  loginButtonText: {
    color: COLORS.white,

    fontSize: 16,

    fontWeight: "700",
  },

  // ==========================================================
  // REGISTER
  // ==========================================================

  registerButton: {
    alignItems: "center",

    justifyContent: "center",

    marginTop: 16,

    paddingVertical: 8,
  },

  registerText: {
    fontSize: 14,

    color: COLORS.muted,

    textAlign: "center",
  },

  registerHighlight: {
    color: COLORS.orange,

    fontWeight: "700",
  },
});