import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const BASE_URL = "https://api.homecookt.com";

const VerifyOtpScreen = ({
  navigation,
  route,
}) => {
  // ============================================================
  // GET EMAIL FROM PREVIOUS SCREEN
  // ============================================================

  const email =
    route?.params?.email ||
    route?.params?.value ||
    "";

  // ============================================================
  // STATE
  // ============================================================

  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [otpError, setOtpError] =
    useState("");

  // ============================================================
  // VALIDATE OTP
  // ============================================================

  const validateOtp = () => {
    const trimmedOtp =
      otp.trim();

    if (!trimmedOtp) {
      setOtpError(
        "Enter OTP"
      );

      return false;
    }

    if (
      trimmedOtp.length < 4
    ) {
      setOtpError(
        "Invalid OTP"
      );

      return false;
    }

    // Make sure only numbers are entered
    if (!/^\d+$/.test(trimmedOtp)) {
      setOtpError(
        "OTP must contain only numbers"
      );

      return false;
    }

    setOtpError("");

    return true;
  };

  // ============================================================
  // VERIFY OTP API
  // ============================================================

  const verifyOtp = async () => {
    Keyboard.dismiss();

    if (!email) {
      Alert.alert(
        "Error",
        "Email address is missing."
      );

      return;
    }

    if (!validateOtp()) {
      return;
    }

    try {
      setIsLoading(true);

      const url =
        `${BASE_URL}/api/v1/users/verify-otp`;

      console.log(
        "VERIFY OTP URL =>",
        url
      );

      console.log(
        "VERIFY OTP EMAIL =>",
        email
      );

      console.log(
        "VERIFY OTP =>",
        otp.trim()
      );

      // ========================================================
      // REQUEST
      // ========================================================

      const controller =
        new AbortController();

      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 15000);

      const response =
        await fetch(url, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email:
              email.trim(),

            otp:
              otp.trim(),
          }),

          signal:
            controller.signal,
        });

      clearTimeout(timeout);

      // ========================================================
      // RESPONSE
      // ========================================================

      const responseText =
        await response.text();

      console.log(
        "VERIFY OTP STATUS =>",
        response.status
      );

      console.log(
        "VERIFY OTP BODY =>",
        responseText
      );

      let data = {};

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch (error) {
        data = {
          message:
            responseText ||
            "Invalid response from server",
        };
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      if (
        response.status === 200
      ) {
        const message =
          data?.message ||
          "OTP Verified";

        Alert.alert(
          "Success",
          message,
          [
            {
              text: "OK",
              onPress: () => {
                // Same as:
                // Navigator.pushNamedAndRemoveUntil(
                //   context,
                //   "/login",
                //   (route) => false,
                // );

                navigation.reset({
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

      // ========================================================
      // ERROR
      // ========================================================

      let errorMessage =
        "Invalid OTP";

      if (
        typeof data?.message ===
        "string"
      ) {
        errorMessage =
          data.message;
      } else if (
        typeof data?.detail ===
        "string"
      ) {
        errorMessage =
          data.detail;
      } else if (
        typeof data?.error ===
        "string"
      ) {
        errorMessage =
          data.error;
      } else if (
        Array.isArray(
          data?.detail
        )
      ) {
        errorMessage =
          data.detail
            .map((item) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              return (
                item?.msg ||
                "Invalid OTP"
              );
            })
            .join("\n");
      }

      Alert.alert(
        "Verification Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "VERIFY OTP ERROR =>",
        error
      );

      if (
        error?.name ===
        "AbortError"
      ) {
        Alert.alert(
          "Timeout",
          "The server took too long to respond. Please try again."
        );
      } else {
        Alert.alert(
          "Error",
          error?.message ||
            "Unable to verify OTP. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // OTP CHANGE
  // ============================================================

  const handleOtpChange = (
    value
  ) => {
    // Allow only numbers
    const numericValue =
      value.replace(
        /[^0-9]/g,
        ""
      );

    // Limit OTP length to 6 digits.
    // If your backend uses 4 digits, this still works.
    if (
      numericValue.length <= 6
    ) {
      setOtp(
        numericValue
      );
    }

    if (otpError) {
      setOtpError("");
    }
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEF0E6"
      />

      <LinearGradient
        colors={[
          "#FEF0E6",
          "#FEF8F3",
          "#FEFBEE",
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.background}
      >
        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            navigation.goBack()
          }
          disabled={isLoading}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111827"
          />
        </TouchableOpacity>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <KeyboardAvoidingView
          style={
            styles.keyboardView
          }
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
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* ==================================================
                ICON
            ================================================== */}

            <LinearGradient
              colors={[
                "#F59E0B",
                "#D97706",
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
                styles.iconContainer
              }
            >
              <Ionicons
                name="checkmark-done"
                size={42}
                color="#FFFFFF"
              />
            </LinearGradient>

            {/* ==================================================
                TITLE
            ================================================== */}

            <Text
              style={
                styles.title
              }
            >
              Verify OTP
            </Text>

            {/* ==================================================
                SUBTITLE
            ================================================== */}

            <Text
              style={
                styles.subtitle
              }
            >
              Enter the OTP sent to
            </Text>

            <Text
              style={
                styles.emailText
              }
            >
              {email}
            </Text>

            {/* ==================================================
                CARD
            ================================================== */}

            <View
              style={
                styles.card
              }
            >
              {/* ==================================================
                  OTP LABEL
              ================================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Verification Code
              </Text>

              {/* ==================================================
                  OTP INPUT
              ================================================== */}

              <View
                style={[
                  styles.inputContainer,
                  otpError &&
                    styles.inputError,
                ]}
              >
                <View
                  style={
                    styles.inputIconContainer
                  }
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#F59E0B"
                  />
                </View>

                <TextInput
                  value={otp}
                  onChangeText={
                    handleOtpChange
                  }
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                  autoFocus={true}
                  style={
                    styles.otpInput
                  }
                  returnKeyType="done"
                  onSubmitEditing={
                    verifyOtp
                  }
                />
              </View>

              {/* ==================================================
                  ERROR
              ================================================== */}

              {otpError ? (
                <View
                  style={
                    styles.errorContainer
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#DC2626"
                  />

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {otpError}
                  </Text>
                </View>
              ) : null}

              {/* ==================================================
                  OTP INFO
              ================================================== */}

              <Text
                style={
                  styles.infoText
                }
              >
                Please enter the verification
                code sent to your email.
              </Text>

              {/* ==================================================
                  VERIFY BUTTON
              ================================================== */}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  verifyOtp
                }
                disabled={
                  isLoading
                }
                style={
                  styles.verifyButton
                }
              >
                <LinearGradient
                  colors={[
                    "#F59E0B",
                    "#D97706",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={
                    styles.verifyGradient
                  }
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Verifying...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={23}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Verify OTP
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ==================================================
                SECURITY MESSAGE
            ================================================== */}

            <View
              style={
                styles.securityContainer
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#F59E0B"
              />

              <Text
                style={
                  styles.securityText
                }
              >
                Your verification code is
                secure and private.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEF0E6",
  },

  background: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  backButton: {
    position: "absolute",
    top: 14,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent:
      "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scrollContent: {
    flexGrow: 1,
    justifyContent:
      "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 75,
    paddingBottom: 40,
  },

  // ==========================================================
  // ICON
  // ==========================================================

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent:
      "center",

    elevation: 6,

    shadowColor: "#F59E0B",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    marginTop: 24,
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },

  emailText: {
    marginTop: 4,
    fontSize: 14,
    color: "#B45309",
    fontWeight: "700",
    textAlign: "center",
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    width: "100%",
    maxWidth: 430,
    marginTop: 30,
    padding: 24,
    borderRadius: 24,

    backgroundColor:
      "rgba(255,255,255,0.86)",

    borderWidth: 1,
    borderColor:
      "rgba(245,158,11,0.12)",

    elevation: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  // ==========================================================
  // INPUT
  // ==========================================================

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "#FFFFFF",
    borderWidth: 1,
    borderColor:
      "#E5E7EB",
    borderRadius: 15,
    paddingHorizontal: 13,
  },

  inputError: {
    borderColor:
      "#DC2626",
  },

  inputIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      "#FFF7ED",
    alignItems: "center",
    justifyContent:
      "center",
    marginRight: 9,
  },

  otpInput: {
    flex: 1,
    height: 54,
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 5,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    flex: 1,
  },

  // ==========================================================
  // INFO
  // ==========================================================

  infoText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  // ==========================================================
  // VERIFY BUTTON
  // ==========================================================

  verifyButton: {
    marginTop: 23,
    borderRadius: 15,
    overflow: "hidden",
  },

  verifyGradient: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    gap: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  // ==========================================================
  // SECURITY
  // ==========================================================

  securityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    marginTop: 22,
    gap: 7,
  },

  securityText: {
    color: "#6B7280",
    fontSize: 12,
  },
});

export default VerifyOtpScreen;