import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLocalSearchParams, useRouter } from "expo-router";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import DateTimePicker from "@react-native-community/datetimepicker";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

// ============================================================
// EXPO 57 FILE UPLOAD
// ============================================================

import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";

// IMPORTANT:
// Use the same theme/app provider used by SettingsScreen.
import { useApp } from "./_layout";

const BASE_URL = "https://api.homecookt.com";

const GENDER_OPTIONS = [
  {
    label: "Male",
    value: "male",
    icon: "male-outline",
  },
  {
    label: "Female",
    value: "female",
    icon: "female-outline",
  },
  {
    label: "Other",
    value: "other",
    icon: "person-outline",
  },
];

// ============================================================
// DATE HELPERS
// ============================================================

function formatDateForApi(date) {
  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function parseDateString(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  const text = String(value).trim();

  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

  let day;
  let month;
  let year;

  if (ddmmyyyy.test(text)) {
    const match = text.match(ddmmyyyy);

    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else if (yyyymmdd.test(text)) {
    const match = text.match(yyyymmdd);

    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const parsed = new Date(text);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  const result = new Date(year, month - 1, day);

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result;
}

// ============================================================
// MAIN SCREEN
// ============================================================

export default function UpdateProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ============================================================
  // THEME
  // ============================================================

  const { isDarkMode, colors } = useApp();

  const styles = useMemo(
    () => createStyles(colors, isDarkMode),
    [colors, isDarkMode]
  );

  // ============================================================
  // USER PARAM
  // ============================================================

  const initialUser = useMemo(() => {
    try {
      if (!params?.user) {
        return {};
      }

      if (typeof params.user === "string") {
        return JSON.parse(params.user);
      }

      if (Array.isArray(params.user) && params.user.length > 0) {
        return JSON.parse(params.user[0]);
      }

      return {};
    } catch (error) {
      console.log("FAILED TO PARSE USER PARAMETER:", error);
      return {};
    }
  }, [params]);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [foodPreferences, setFoodPreferences] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [favoriteCuisine, setFavoriteCuisine] = useState("");

  // ============================================================
  // IMAGE
  // ============================================================

  const [profileImage, setProfileImage] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState("");

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // ============================================================
  // MODALS
  // ============================================================

  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");

      if (accessToken) {
        return accessToken;
      }

      const accessTokenFallback =
        await AsyncStorage.getItem("accessToken");

      if (accessTokenFallback) {
        return accessTokenFallback;
      }

      const token = await AsyncStorage.getItem("token");

      return token;
    } catch (error) {
      console.log("FAILED TO GET TOKEN:", error);
      return null;
    }
  };

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================

  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    try {
      setLoading(true);

      // --------------------------------------------------------
      // ROUTE PARAMS
      // --------------------------------------------------------

      setName(initialUser?.name || "");

      setPhone(
        initialUser?.phone_number ||
          initialUser?.phone ||
          initialUser?.phoneNumber ||
          ""
      );

      setGender(initialUser?.gender || "");

      const initialDob =
        initialUser?.dob ||
        initialUser?.date_of_birth ||
        initialUser?.dateOfBirth ||
        "";

      setDob(initialDob || "");

      setBio(initialUser?.bio || "");

      setCountry(initialUser?.country || "");
      setState(initialUser?.state || "");
      setCity(initialUser?.city || "");
      setPincode(initialUser?.pincode || "");
      setAddress(initialUser?.address || "");

      setLatitude(
        initialUser?.latitude !== undefined &&
          initialUser?.latitude !== null
          ? String(initialUser.latitude)
          : ""
      );

      setLongitude(
        initialUser?.longitude !== undefined &&
          initialUser?.longitude !== null
          ? String(initialUser.longitude)
          : ""
      );

      setFoodPreferences(
        initialUser?.food_preferences ||
          initialUser?.foodPreferences ||
          ""
      );

      setDietaryPreference(
        initialUser?.dietary_preference ||
          initialUser?.dietaryPreference ||
          ""
      );

      setFavoriteCuisine(
        initialUser?.favorite_cuisine ||
          initialUser?.favoriteCuisine ||
          ""
      );

      const initialImage =
        initialUser?.profile_photo ||
        initialUser?.profile_image ||
        initialUser?.profileImage ||
        initialUser?.image ||
        "";

      if (initialImage) {
        setExistingProfileImage(initialImage);
      }

      // --------------------------------------------------------
      // FETCH LATEST PROFILE
      // --------------------------------------------------------

      await fetchProfile();
    } catch (error) {
      console.log("INITIALIZE PROFILE ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH PROFILE
  // ============================================================

  const fetchProfile = async () => {
    let timeout;

    try {
      const token = await getToken();

      if (!token) {
        setLoading(false);
        router.replace("/Login");
        return;
      }

      const controller = new AbortController();

      timeout = setTimeout(() => {
        controller.abort();
      }, 20000);

      const response = await fetch(
        `${BASE_URL}/api/v1/users/profile`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },

          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      timeout = null;

      console.log("PROFILE GET STATUS:", response.status);

      const responseText = await response.text();

      console.log(
        "PROFILE GET RESPONSE:",
        responseText
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await AsyncStorage.multiRemove([
          "access_token",
          "accessToken",
          "token",
        ]);

        router.replace("/Login");
        return;
      }

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "PROFILE RESPONSE JSON PARSE ERROR:",
          error
        );
      }

      if (!response.ok) {
        console.log(
          "PROFILE API ERROR:",
          response.status,
          data
        );
        return;
      }

      const profile =
        data?.profile ||
        data?.data ||
        data?.user ||
        data ||
        {};

      setName(profile?.name || "");

      setPhone(
        profile?.phone_number ||
          profile?.phone ||
          profile?.phoneNumber ||
          ""
      );

      setGender(profile?.gender || "");

      const profileDob =
        profile?.dob ||
        profile?.date_of_birth ||
        profile?.dateOfBirth ||
        "";

      setDob(profileDob || "");

      setBio(profile?.bio || "");

      setCountry(profile?.country || "");
      setState(profile?.state || "");
      setCity(profile?.city || "");
      setPincode(profile?.pincode || "");
      setAddress(profile?.address || "");

      setLatitude(
        profile?.latitude !== undefined &&
          profile?.latitude !== null
          ? String(profile.latitude)
          : ""
      );

      setLongitude(
        profile?.longitude !== undefined &&
          profile?.longitude !== null
          ? String(profile.longitude)
          : ""
      );

      setFoodPreferences(
        profile?.food_preferences ||
          profile?.foodPreferences ||
          ""
      );

      setDietaryPreference(
        profile?.dietary_preference ||
          profile?.dietaryPreference ||
          ""
      );

      setFavoriteCuisine(
        profile?.favorite_cuisine ||
          profile?.favoriteCuisine ||
          ""
      );

      const image =
        profile?.profile_photo ||
        profile?.profile_image ||
        profile?.profileImage ||
        profile?.image ||
        "";

      if (image) {
        setExistingProfileImage(image);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        console.log("PROFILE REQUEST TIMED OUT");
      } else {
        console.log("FETCH PROFILE ERROR:", error);
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  };

  // ============================================================
  // IMAGE PICKER
  // ============================================================

  const pickProfileImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select a profile photo."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        Alert.alert(
          "Image Error",
          "The selected image could not be loaded."
        );
        return;
      }

      console.log("SELECTED IMAGE:", asset);

      setProfileImage(asset);
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to select the profile photo."
      );
    }
  };

  // ============================================================
  // DATE PICKER
  // ============================================================

  const openDatePicker = () => {
    const parsedDate = parseDateString(dob);

    if (parsedDate) {
      setSelectedDate(parsedDate);
    } else {
      setSelectedDate(new Date());
    }

    setDatePickerVisible(true);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setDatePickerVisible(false);
    }

    if (!date) {
      return;
    }

    setSelectedDate(date);
    setDob(formatDateForApi(date));

    if (Platform.OS === "ios") {
      setDatePickerVisible(false);
    }
  };

  // ============================================================
  // CURRENT LOCATION
  // ============================================================

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      console.log("GETTING CURRENT LOCATION...");

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services on your device and try again."
        );
        return;
      }

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please allow location permission to use your current location."
        );
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      console.log("CURRENT LATITUDE:", lat);
      console.log("CURRENT LONGITUDE:", lng);

      setLatitude(String(lat));
      setLongitude(String(lng));

      try {
        const addresses =
          await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

        if (addresses?.length > 0) {
          const result = addresses[0];

          setCountry(
            result.country ||
              result.isoCountryCode ||
              ""
          );

          setState(
            result.region ||
              result.district ||
              ""
          );

          setCity(
            result.city ||
              result.subregion ||
              result.district ||
              ""
          );

          setPincode(
            result.postalCode ||
              ""
          );

          const parts = [
            result.name,
            result.street,
            result.subregion,
          ].filter(Boolean);

          setAddress(
            parts.length > 0
              ? [...new Set(parts)].join(", ")
              : ""
          );
        }
      } catch (error) {
        console.log(
          "REVERSE GEOCODING ERROR:",
          error
        );
      }

      Alert.alert(
        "Location Updated",
        "Your current location has been added to the profile."
      );
    } catch (error) {
      console.log(
        "CURRENT LOCATION ERROR:",
        error
      );

      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again."
      );
    } finally {
      setGettingLocation(false);
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      Alert.alert(
        "Required",
        "Please enter your name."
      );

      return false;
    }

    const trimmedPhone =
      String(phone || "").trim();

    if (
      trimmedPhone &&
      trimmedPhone.length < 5
    ) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid phone number."
      );

      return false;
    }

    const trimmedPincode =
      String(pincode || "").trim();

    if (
      trimmedPincode &&
      trimmedPincode.length < 3
    ) {
      Alert.alert(
        "Invalid Pincode",
        "Please enter a valid pincode."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const saveProfile = async () => {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    let timeout;

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        router.replace("/Login");
        return;
      }

      console.log("========================================");
      console.log("UPDATING PROFILE");
      console.log("PROFILE IMAGE:", profileImage);
      console.log("========================================");

      // ========================================================
      // CREATE FORM DATA
      // ========================================================

      const formData = new FormData();

      // --------------------------------------------------------
      // NORMAL TEXT FIELDS
      // --------------------------------------------------------

      formData.append(
        "name",
        String(name || "").trim()
      );

      formData.append(
        "phone_number",
        String(phone || "").trim()
      );

      formData.append(
        "gender",
        String(gender || "")
      );

      formData.append(
        "dob",
        String(dob || "")
      );

      formData.append(
        "bio",
        String(bio || "").trim()
      );

      formData.append(
        "country",
        String(country || "").trim()
      );

      formData.append(
        "state",
        String(state || "").trim()
      );

      formData.append(
        "city",
        String(city || "").trim()
      );

      formData.append(
        "pincode",
        String(pincode || "").trim()
      );

      formData.append(
        "address",
        String(address || "").trim()
      );

      formData.append(
        "latitude",
        String(latitude ?? "")
      );

      formData.append(
        "longitude",
        String(longitude ?? "")
      );

      formData.append(
        "food_preferences",
        String(foodPreferences || "").trim()
      );

      formData.append(
        "dietary_preference",
        String(dietaryPreference || "").trim()
      );

      formData.append(
        "favorite_cuisine",
        String(favoriteCuisine || "").trim()
      );

      // ========================================================
      // PROFILE IMAGE
      // ========================================================

      if (profileImage?.uri) {
        const imageUri = String(
          profileImage.uri
        );

        console.log(
          "PROFILE IMAGE URI:",
          imageUri
        );

        // ------------------------------------------------------
        // IMPORTANT FOR EXPO 57:
        //
        // DO NOT use:
        //
        // {
        //   uri,
        //   name,
        //   type
        // }
        //
        // Instead use expo-file-system File.
        // ------------------------------------------------------

        const imageFile = new File(
          imageUri
        );

        console.log(
          "EXPO FILE CREATED:",
          imageFile
        );

        // Verify that the file actually exists.
        const fileExists =
          await imageFile.exists;

        console.log(
          "PROFILE IMAGE FILE EXISTS:",
          fileExists
        );

        if (!fileExists) {
          throw new Error(
            "The selected profile image file no longer exists."
          );
        }

        console.log(
          "PROFILE IMAGE FILE SIZE:",
          imageFile.size
        );

        console.log(
          "PROFILE IMAGE FILE TYPE:",
          imageFile.type
        );

        // ------------------------------------------------------
        // THIS IS THE ONLY IMAGE FORM DATA PART.
        // ------------------------------------------------------

        formData.append(
          "profile_photo",
          imageFile
        );

        console.log(
          "PROFILE PHOTO ADDED TO FORM DATA"
        );
      } else {
        console.log(
          "NO NEW PROFILE IMAGE SELECTED"
        );
      }

      console.log(
        "PROFILE FORM DATA CREATED"
      );

      // ========================================================
      // API REQUEST
      // ========================================================

      const controller =
        new AbortController();

      timeout = setTimeout(() => {
        controller.abort();
      }, 30000);

      console.log(
        "SENDING PROFILE UPDATE REQUEST..."
      );

      // IMPORTANT:
      // Use Expo fetch for FormData + File.
      const response = await expoFetch(
        `${BASE_URL}/api/v1/users/profile`,
        {
          method: "PUT",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          // DO NOT manually set Content-Type.
          body: formData,

          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      timeout = null;

      console.log(
        "UPDATE PROFILE STATUS:",
        response.status
      );

      // ========================================================
      // READ RESPONSE EXACTLY ONCE
      // ========================================================

      const responseText =
        await response.text();

      console.log(
        "UPDATE PROFILE RESPONSE:",
        responseText
      );

      // ========================================================
      // SESSION EXPIRED
      // ========================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await AsyncStorage.multiRemove([
          "access_token",
          "accessToken",
          "token",
        ]);

        Alert.alert(
          "Session Expired",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/Login");
              },
            },
          ]
        );

        return;
      }

      // ========================================================
      // PARSE RESPONSE
      // ========================================================

      let responseData = {};

      try {
        responseData = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "UPDATE PROFILE RESPONSE IS NOT JSON"
        );
      }

      // ========================================================
      // API ERROR
      // ========================================================

      if (!response.ok) {
        console.log(
          "UPDATE PROFILE API ERROR:",
          response.status,
          responseData
        );

        let errorMessage =
          responseData?.detail ||
          responseData?.message ||
          responseData?.error ||
          "";

        // Handle FastAPI validation errors.
        if (
          !errorMessage &&
          Array.isArray(responseData?.detail)
        ) {
          errorMessage =
            responseData.detail
              .map((item) => {
                if (typeof item === "string") {
                  return item;
                }

                return (
                  item?.msg ||
                  item?.message ||
                  "Invalid profile data."
                );
              })
              .join("\n");
        }

        if (!errorMessage) {
          errorMessage =
            responseText ||
            "Unable to update your profile.";
        }

        Alert.alert(
          "Update Failed",
          String(errorMessage)
        );

        return;
      }

      // ========================================================
      // GET UPDATED PROFILE FROM RESPONSE
      // ========================================================

      const returnedProfile =
        responseData?.profile ||
        responseData?.data ||
        responseData?.user ||
        null;

      // ========================================================
      // UPDATE LOCAL STORAGE
      // ========================================================

      try {
        const storedUser =
          await AsyncStorage.getItem(
            "user"
          );

        let userObject = {};

        if (storedUser) {
          try {
            userObject =
              JSON.parse(storedUser);
          } catch {
            userObject = {};
          }
        }

        const updatedUser = {
          ...userObject,
          ...initialUser,

          name: String(
            returnedProfile?.name ??
              name ??
              ""
          ).trim(),

          phone_number: String(
            returnedProfile?.phone_number ??
              phone ??
              ""
          ).trim(),

          gender: String(
            returnedProfile?.gender ??
              gender ??
              ""
          ),

          dob: String(
            returnedProfile?.dob ??
              dob ??
              ""
          ),

          bio: String(
            returnedProfile?.bio ??
              bio ??
              ""
          ).trim(),

          country: String(
            returnedProfile?.country ??
              country ??
              ""
          ).trim(),

          state: String(
            returnedProfile?.state ??
              state ??
              ""
          ).trim(),

          city: String(
            returnedProfile?.city ??
              city ??
              ""
          ).trim(),

          pincode: String(
            returnedProfile?.pincode ??
              pincode ??
              ""
          ).trim(),

          address: String(
            returnedProfile?.address ??
              address ??
              ""
          ).trim(),

          latitude: String(
            returnedProfile?.latitude ??
              latitude ??
              ""
          ),

          longitude: String(
            returnedProfile?.longitude ??
              longitude ??
              ""
          ),

          food_preferences: String(
            returnedProfile?.food_preferences ??
              foodPreferences ??
              ""
          ).trim(),

          dietary_preference: String(
            returnedProfile?.dietary_preference ??
              dietaryPreference ??
              ""
          ).trim(),

          favorite_cuisine: String(
            returnedProfile?.favorite_cuisine ??
              favoriteCuisine ??
              ""
          ).trim(),
        };

        // ------------------------------------------------------
        // IMPORTANT:
        // If backend returned the uploaded image URL,
        // keep that URL instead of the temporary local URI.
        // ------------------------------------------------------

        const returnedImage =
          returnedProfile?.profile_photo ||
          returnedProfile?.profile_image ||
          returnedProfile?.profileImage ||
          returnedProfile?.image ||
          responseData?.profile_photo ||
          responseData?.profile_image ||
          responseData?.image ||
          "";

        if (returnedImage) {
          updatedUser.image =
            returnedImage;

          updatedUser.profile_photo =
            returnedImage;
        } else if (
          profileImage?.uri
        ) {
          // Temporary local preview only.
          updatedUser.image =
            profileImage.uri;
        }

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        await AsyncStorage.setItem(
          "name",
          String(
            updatedUser.name || ""
          )
        );

        console.log(
          "LOCAL USER STORAGE UPDATED"
        );
      } catch (storageError) {
        console.log(
          "LOCAL STORAGE UPDATE ERROR:",
          storageError
        );
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "SAVE PROFILE ERROR:",
        error
      );

      if (
        error?.name === "AbortError"
      ) {
        Alert.alert(
          "Request Timeout",
          "The profile update took too long. Please try again."
        );
      } else {
        Alert.alert(
          "Update Failed",
          error?.message ||
            "Something went wrong while updating your profile."
        );
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }

      setSaving(false);
    }
  };

  // ============================================================
  // IMAGE SOURCE
  // ============================================================

  const imageSource =
    profileImage?.uri
      ? { uri: profileImage.uri }
      : typeof existingProfileImage ===
          "string" &&
        existingProfileImage
      ? { uri: existingProfileImage }
      : existingProfileImage?.uri
      ? {
          uri: existingProfileImage.uri,
        }
      : null;

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={styles.loadingContainer}
      >
        <StatusBar
          barStyle={
            isDarkMode
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            colors.background
          }
        />

        <ActivityIndicator
          size="large"
          color={colors.gold}
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.orange}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={
            styles.contentContainer
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <LinearGradient
            colors={[
              colors.gold,
              colors.orange,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerTextContainer
              }
            >
              <Text
                style={styles.headerTitle}
              >
                Update Profile
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Keep your information up to date
              </Text>
            </View>
          </LinearGradient>

          {/* ================================================== */}
          {/* PROFILE PHOTO */}
          {/* ================================================== */}

          <View
            style={styles.profileSection}
          >
            <View
              style={
                styles.profileImageWrapper
              }
            >
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={
                    styles.profileImagePlaceholder
                  }
                >
                  <Ionicons
                    name="person"
                    size={55}
                    color={
                      colors.mutedForeground
                    }
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  pickProfileImage
                }
                style={styles.cameraButton}
              >
                <Ionicons
                  name="camera"
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                pickProfileImage
              }
            >
              <Text
                style={
                  styles.changePhotoText
                }
              >
                Change profile photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================================================== */}
          {/* PERSONAL INFORMATION */}
          {/* ================================================== */}

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Personal Information
            </Text>

            {/* NAME */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Full Name
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* PHONE */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Phone Number
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* GENDER */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Gender
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setGenderModalVisible(
                    true
                  )
                }
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <Text
                  style={[
                    styles.selectText,
                    !gender &&
                      styles.placeholderText,
                  ]}
                >
                  {gender
                    ? GENDER_OPTIONS.find(
                        (item) =>
                          item.value ===
                          gender
                      )?.label ||
                      gender
                    : "Select gender"}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={
                    colors.mutedForeground
                  }
                />
              </TouchableOpacity>
            </View>

            {/* DATE OF BIRTH */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Date of Birth
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  openDatePicker
                }
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <Text
                  style={[
                    styles.selectText,
                    !dob &&
                      styles.placeholderText,
                  ]}
                >
                  {dob ||
                    "Select date of birth"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DATE PICKER */}

            {datePickerVisible && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={
                  Platform.OS === "ios"
                    ? "spinner"
                    : "default"
                }
                maximumDate={
                  new Date()
                }
                onValueChange={
                  handleDateChange
                }
                themeVariant={
                  isDarkMode
                    ? "dark"
                    : "light"
                }
              />
            )}

            {/* BIO */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Bio
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.gold}
                  style={[
                    styles.inputIcon,
                    styles.textAreaIcon,
                  ]}
                />

                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us something about yourself"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ================================================== */}
          {/* LOCATION */}
          {/* ================================================== */}

          <View style={styles.section}>
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Text
                style={styles.sectionTitle}
              >
                Location
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  getCurrentLocation
                }
                disabled={
                  gettingLocation
                }
                style={
                  styles.locationButton
                }
              >
                {gettingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.gold}
                  />
                ) : (
                  <Ionicons
                    name="locate-outline"
                    size={17}
                    color={colors.gold}
                  />
                )}

                <Text
                  style={
                    styles.locationButtonText
                  }
                >
                  {gettingLocation
                    ? "Getting..."
                    : "Use Current"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* COUNTRY */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Country
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={country}
                  onChangeText={
                    setCountry
                  }
                  placeholder="Country"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>

            {/* STATE */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                State
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>

            {/* CITY */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                City
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>

            {/* PINCODE */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Pincode
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={pincode}
                  onChangeText={
                    setPincode
                  }
                  placeholder="Pincode"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* ADDRESS */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Address
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.gold}
                  style={[
                    styles.inputIcon,
                    styles.textAreaIcon,
                  ]}
                />

                <TextInput
                  value={address}
                  onChangeText={
                    setAddress
                  }
                  placeholder="Enter your address"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ================================================== */}
          {/* COORDINATES */}
          {/* ================================================== */}

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Location Coordinates
            </Text>

            <View
              style={styles.coordinatesRow}
            >
              {/* LATITUDE */}

              <View
                style={[
                  styles.coordinateBox,
                  styles.coordinateBoxLeft,
                ]}
              >
                <Text
                  style={
                    styles.coordinateLabel
                  }
                >
                  Latitude
                </Text>

                <Text
                  numberOfLines={1}
                  style={
                    styles.coordinateValue
                  }
                >
                  {latitude ||
                    "Not available"}
                </Text>
              </View>

              {/* LONGITUDE */}

              <View
                style={[
                  styles.coordinateBox,
                  styles.coordinateBoxRight,
                ]}
              >
                <Text
                  style={
                    styles.coordinateLabel
                  }
                >
                  Longitude
                </Text>

                <Text
                  numberOfLines={1}
                  style={
                    styles.coordinateValue
                  }
                >
                  {longitude ||
                    "Not available"}
                </Text>
              </View>
            </View>
          </View>

          {/* ================================================== */}
          {/* FOOD PREFERENCES */}
          {/* ================================================== */}

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Food Preferences
            </Text>

            {/* FOOD PREFERENCES */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Food Preferences
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={
                    foodPreferences
                  }
                  onChangeText={
                    setFoodPreferences
                  }
                  placeholder="e.g. Indian, Italian, Healthy"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>

            {/* DIETARY PREFERENCE */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Dietary Preference
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="nutrition-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={
                    dietaryPreference
                  }
                  onChangeText={
                    setDietaryPreference
                  }
                  placeholder="e.g. Vegetarian, Vegan"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>

            {/* FAVORITE CUISINE */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={styles.inputLabel}
              >
                Favorite Cuisine
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={colors.gold}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  value={
                    favoriteCuisine
                  }
                  onChangeText={
                    setFavoriteCuisine
                  }
                  placeholder="e.g. South Indian"
                  placeholderTextColor={
                    colors.mutedForeground
                  }
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* ================================================== */}
          {/* UPDATE BUTTON */}
          {/* ================================================== */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={saveProfile}
            disabled={saving}
            style={[
              styles.updateButtonWrapper,
              saving &&
                styles.updateButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={[
                colors.gold,
                colors.orange,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.updateButton}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#FFFFFF"
                />
              )}

              <Text
                style={
                  styles.updateButtonText
                }
              >
                {saving
                  ? "Updating..."
                  : "Update Profile"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ====================================================== */}
      {/* GENDER MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={genderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setGenderModalVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setGenderModalVisible(false)
          }
        >
          <Pressable
            style={styles.genderModal}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
              >
                Select Gender
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setGenderModalVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>

            <View
              style={styles.genderOptions}
            >
              {GENDER_OPTIONS.map(
                (option) => {
                  const selected =
                    gender ===
                    option.value;

                  return (
                    <TouchableOpacity
                      key={
                        option.value
                      }
                      activeOpacity={0.8}
                      onPress={() => {
                        setGender(
                          option.value
                        );

                        setGenderModalVisible(
                          false
                        );
                      }}
                      style={[
                        styles.genderOption,
                        selected &&
                          styles.genderOptionSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.genderIcon,
                          selected &&
                            styles.genderIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={
                            option.icon
                          }
                          size={21}
                          color={
                            selected
                              ? colors.orange
                              : colors.mutedForeground
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.genderOptionText,
                          selected &&
                            styles.genderOptionTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={
                            colors.orange
                          }
                          style={
                            styles.genderCheck
                          }
                        />
                      )}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// DYNAMIC THEME STYLES
// ============================================================

const createStyles = (
  colors,
  isDarkMode
) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    // ============================================================
    // SCREEN
    // ============================================================

    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode
        ? "#0F0E0D"
        : "#FEF8F3",
    },

    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? "#0F0E0D"
        : "#FEF8F3",
    },

    contentContainer: {
      paddingBottom: 25,
    },

    // ============================================================
    // LOADING
    // ============================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode
        ? "#0F0E0D"
        : "#FEF8F3",
    },

    loadingText: {
      marginTop: 14,
      fontSize: 15,
      color: isDarkMode
        ? "#B8B3AD"
        : "#777777",
      fontWeight: "500",
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
      minHeight: 118,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 22,
      flexDirection: "row",
      alignItems: "center",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "rgba(255,255,255,0.18)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.22)",
    },

    headerTextContainer: {
      flex: 1,
      marginLeft: 14,
    },

    headerTitle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: 0.2,
    },

    headerSubtitle: {
      color: "rgba(255,255,255,0.88)",
      fontSize: 13,
      marginTop: 5,
      fontWeight: "500",
    },

    // ============================================================
    // PROFILE PHOTO
    // ============================================================

    profileSection: {
      alignItems: "center",
      paddingTop: 25,
      paddingBottom: 8,
    },

    profileImageWrapper: {
      position: "relative",
      width: 116,
      height: 116,
      borderRadius: 58,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF4EA",
      borderWidth: 3,
      borderColor: isDarkMode
        ? "#FBBF24"
        : "#F97316",
      shadowColor: "#F97316",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity:
        isDarkMode ? 0 : 0.16,
      shadowRadius: 10,
      elevation: 5,
    },

    profileImage: {
      width: 108,
      height: 108,
      borderRadius: 54,
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF4EA",
    },

    profileImagePlaceholder: {
      width: 108,
      height: 108,
      borderRadius: 54,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF4EA",
    },

    cameraButton: {
      position: "absolute",
      right: -2,
      bottom: 1,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F97316",
      borderWidth: 3,
      borderColor: isDarkMode
        ? "#0F0E0D"
        : "#FEF8F3",
      elevation: 5,
      shadowColor: "#F97316",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },

    changePhotoText: {
      marginTop: 11,
      fontSize: 14,
      fontWeight: "700",
      color: isDarkMode
        ? "#FBBF24"
        : "#F97316",
    },

    // ============================================================
    // SECTIONS
    // ============================================================

    section: {
      marginHorizontal: 16,
      marginTop: 18,
      padding: 17,
      borderRadius: 20,
      backgroundColor: isDarkMode
        ? "#171412"
        : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "#302820"
        : "#F0E5DC",
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity:
        isDarkMode ? 0 : 0.055,
      shadowRadius: 10,
      elevation: isDarkMode ? 0 : 2,
    },

    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    sectionTitleRowText: {
      flex: 1,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: isDarkMode
        ? "#FFFFFF"
        : "#111111",
      marginBottom: 14,
    },

    // ============================================================
    // INPUT GROUP
    // ============================================================

    inputGroup: {
      marginBottom: 16,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: isDarkMode
        ? "#F5F1ED"
        : "#222222",
      marginBottom: 7,
    },

    inputWrapper: {
      minHeight: 52,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "#382F27"
        : "#E8DDD4",
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF9F5",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
    },

    inputIcon: {
      marginRight: 10,
    },

    input: {
      flex: 1,
      minHeight: 50,
      paddingVertical: 10,
      fontSize: 15,
      color: isDarkMode
        ? "#FFFFFF"
        : "#111111",
    },

    selectText: {
      flex: 1,
      fontSize: 15,
      color: isDarkMode
        ? "#FFFFFF"
        : "#111111",
    },

    placeholderText: {
      color: isDarkMode
        ? "#817970"
        : "#999999",
    },

    // ============================================================
    // TEXT AREAS
    // ============================================================

    textAreaWrapper: {
      alignItems: "flex-start",
      minHeight: 105,
      paddingTop: 12,
    },

    textAreaIcon: {
      marginTop: 2,
    },

    textArea: {
      minHeight: 85,
      paddingTop: 0,
      textAlignVertical: "top",
    },

    // ============================================================
    // LOCATION BUTTON
    // ============================================================

    locationButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 11,
      backgroundColor: isDarkMode
        ? "rgba(249,115,22,0.14)"
        : "#FFF1E5",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(249,115,22,0.30)"
        : "#FFD5B5",
      gap: 5,
    },

    locationButtonText: {
      fontSize: 12,
      fontWeight: "800",
      color: isDarkMode
        ? "#FBBF24"
        : "#F97316",
    },

    // ============================================================
    // COORDINATES
    // ============================================================

    coordinatesRow: {
      flexDirection: "row",
    },

    coordinateBox: {
      flex: 1,
      padding: 13,
      borderRadius: 13,
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF9F5",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "#382F27"
        : "#E8DDD4",
    },

    coordinateBoxLeft: {
      marginRight: 6,
    },

    coordinateBoxRight: {
      marginLeft: 6,
    },

    coordinateLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode
        ? "#9C928A"
        : "#777777",
      marginBottom: 6,
    },

    coordinateValue: {
      fontSize: 13,
      fontWeight: "700",
      color: isDarkMode
        ? "#FBBF24"
        : "#F97316",
    },

    // ============================================================
    // UPDATE BUTTON
    // ============================================================

    updateButtonWrapper: {
      marginHorizontal: 16,
      marginTop: 23,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#F97316",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        isDarkMode ? 0.18 : 0.22,
      shadowRadius: 9,
      elevation: 5,
    },

    updateButtonDisabled: {
      opacity: 0.65,
    },

    updateButton: {
      minHeight: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },

    updateButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.2,
    },

    bottomSpace: {
      height: 35,
    },

    // ============================================================
    // GENDER MODAL
    // ============================================================

    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },

    genderModal: {
      backgroundColor: isDarkMode
        ? "#171412"
        : "#FFFFFF",
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 18,
      paddingTop: 19,
      paddingBottom:
        Platform.OS === "ios"
          ? 34
          : 24,
      borderTopWidth: 1,
      borderColor: isDarkMode
        ? "#382F27"
        : "#F0E5DC",
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        isDarkMode
          ? "#302820"
          : "#EEE4DC",
    },

    modalTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: isDarkMode
        ? "#FFFFFF"
        : "#111111",
    },

    genderOptions: {
      paddingTop: 11,
    },

    genderOption: {
      minHeight: 62,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "#382F27"
        : "#E8DDD4",
      backgroundColor: isDarkMode
        ? "#211B16"
        : "#FFF9F5",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      marginBottom: 10,
    },

    genderOptionSelected: {
      borderColor: "#F97316",
      backgroundColor: isDarkMode
        ? "rgba(249,115,22,0.12)"
        : "#FFF1E5",
    },

    genderIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode
        ? "#30261E"
        : "#FFF0E2",
      marginRight: 12,
    },

    genderIconSelected: {
      backgroundColor: isDarkMode
        ? "rgba(249,115,22,0.20)"
        : "#FFE4D0",
    },

    genderOptionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: isDarkMode
        ? "#F5F1ED"
        : "#222222",
    },

    genderOptionTextSelected: {
      color: isDarkMode
        ? "#FBBF24"
        : "#F97316",
      fontWeight: "800",
    },

    genderCheck: {
      marginLeft: 8,
    },
  });