import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useApp } from "./_layout";

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// SEARCH SCREEN
// ============================================================

const SearchScreen = () => {
  const { isDarkMode, colors } = useApp();

  // ============================================================
  // STATE
  // ============================================================

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] =
    useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [showSuggestions, setShowSuggestions] =
    useState(true);

  // ============================================================
  // REFS
  // ============================================================

  const searchInputRef = useRef(null);

  const searchTimeoutRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  const searchRequestIdRef = useRef(0);
  const suggestionRequestIdRef = useRef(0);

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      const accessToken =
        await AsyncStorage.getItem("access_token");

      if (accessToken) {
        return accessToken;
      }

      const accessToken2 =
        await AsyncStorage.getItem("accessToken");

      if (accessToken2) {
        return accessToken2;
      }

      const token =
        await AsyncStorage.getItem("token");

      if (token) {
        return token;
      }

      return "";
    } catch (error) {
      console.log("GET TOKEN ERROR =>", error);
      return "";
    }
  };

  // ============================================================
  // NORMALIZE IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    // Handle arrays such as image_urls
    if (Array.isArray(image)) {
      if (image.length === 0) {
        return null;
      }

      image = image[0];
    }

    const imageString = String(image).trim();

    if (!imageString) {
      return null;
    }

    if (
      imageString.startsWith("http://") ||
      imageString.startsWith("https://")
    ) {
      return imageString;
    }

    if (imageString.startsWith("/")) {
      return `${BASE_URL}${imageString}`;
    }

    return `${BASE_URL}/${imageString}`;
  };

  // ============================================================
  // EXTRACT SEARCH RESULTS
  // ============================================================

  const extractSearchResults = (data) => {
    console.log(
      "SEARCH RESPONSE TYPE =>",
      typeof data
    );

    console.log(
      "SEARCH RESPONSE DATA =>",
      data
    );

    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    // Most likely API format
    if (Array.isArray(data.results)) {
      return data.results;
    }

    if (Array.isArray(data.foods)) {
      return data.foods;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    if (Array.isArray(data.food_items)) {
      return data.food_items;
    }

    if (Array.isArray(data.fooditems)) {
      return data.fooditems;
    }

    if (Array.isArray(data.search_results)) {
      return data.search_results;
    }

    return [];
  };

  // ============================================================
  // EXTRACT SUGGESTIONS
  // ============================================================

  const extractSuggestions = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    if (Array.isArray(data.suggestions)) {
      return data.suggestions;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  };

  // ============================================================
  // SEARCH FOOD API
  // ============================================================

  const searchFood = async (
    searchQuery,
    showLoader = true
  ) => {
    const trimmedQuery =
      String(searchQuery || "").trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    const requestId =
      ++searchRequestIdRef.current;

    try {
      if (showLoader) {
        setIsLoading(true);
      }

      const token = await getToken();

      const url =
        `${BASE_URL}/api/v1/search?query=` +
        encodeURIComponent(trimmedQuery);

      console.log(
        "===================================="
      );

      console.log(
        "SEARCH FOOD API"
      );

      console.log(
        "QUERY =>",
        trimmedQuery
      );

      console.log(
        "URL =>",
        url
      );

      console.log(
        "TOKEN EXISTS =>",
        !!token
      );

      console.log(
        "REQUEST ID =>",
        requestId
      );

      console.log(
        "===================================="
      );

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Accept: "application/json",

          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
      });

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "SEARCH JSON PARSE ERROR =>",
          error
        );

        data = {};
      }

      console.log(
        "SEARCH STATUS =>",
        response.status
      );

      console.log(
        "SEARCH RESPONSE =>",
        data
      );

      // Ignore an old API response.
      if (
        requestId !==
        searchRequestIdRef.current
      ) {
        console.log(
          "OLD SEARCH RESPONSE IGNORED =>",
          requestId
        );

        return;
      }

      if (!response.ok) {
        console.log(
          "SEARCH API FAILED =>",
          response.status,
          responseText
        );

        setSearchResults([]);
        return;
      }

      const results =
        extractSearchResults(data);

      console.log(
        "SEARCH RESULTS COUNT =>",
        results.length
      );

      console.log(
        "SEARCH RESULTS =>",
        results
      );

      setSearchResults(results);

      // Actual search results should replace suggestions.
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.log(
        "SEARCH FOOD ERROR =>",
        error
      );

      if (
        requestId ===
        searchRequestIdRef.current
      ) {
        setSearchResults([]);
      }
    } finally {
      if (
        showLoader &&
        requestId ===
          searchRequestIdRef.current
      ) {
        setIsLoading(false);
      }
    }
  };

  // ============================================================
  // SEARCH SUGGESTIONS API
  // ============================================================

  const getSuggestions = async (
    searchQuery
  ) => {
    const trimmedQuery =
      String(searchQuery || "").trim();

    if (!trimmedQuery) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const requestId =
      ++suggestionRequestIdRef.current;

    try {
      setIsSuggestionsLoading(true);

      const token = await getToken();

      const url =
        `${BASE_URL}/api/v1/search-suggestions?q=` +
        encodeURIComponent(trimmedQuery);

      console.log(
        "===================================="
      );

      console.log(
        "SEARCH SUGGESTIONS API"
      );

      console.log(
        "QUERY =>",
        trimmedQuery
      );

      console.log(
        "URL =>",
        url
      );

      console.log(
        "===================================="
      );

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Accept: "application/json",

          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
      });

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "SUGGESTIONS JSON ERROR =>",
          error
        );

        data = {};
      }

      console.log(
        "SUGGESTIONS STATUS =>",
        response.status
      );

      console.log(
        "SUGGESTIONS RESPONSE =>",
        data
      );

      // Ignore old suggestion responses.
      if (
        requestId !==
        suggestionRequestIdRef.current
      ) {
        return;
      }

      if (!response.ok) {
        setSuggestions([]);
        return;
      }

      const result =
        extractSuggestions(data);

      console.log(
        "SUGGESTIONS COUNT =>",
        result.length
      );

      setSuggestions(result);
    } catch (error) {
      console.log(
        "SUGGESTIONS ERROR =>",
        error
      );

      if (
        requestId ===
        suggestionRequestIdRef.current
      ) {
        setSuggestions([]);
      }
    } finally {
      if (
        requestId ===
        suggestionRequestIdRef.current
      ) {
        setIsSuggestionsLoading(false);
      }
    }
  };

  // ============================================================
  // HANDLE SEARCH TEXT
  // ============================================================

  const handleSearchChange = (text) => {
    setQuery(text);

    setShowSuggestions(true);

    // Clear existing timers.
    if (searchTimeoutRef.current) {
      clearTimeout(
        searchTimeoutRef.current
      );
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    const trimmedText =
      String(text || "").trim();

    // ==========================================================
    // EMPTY
    // ==========================================================

    if (!trimmedText) {
      // Invalidate old requests.
      searchRequestIdRef.current += 1;

      suggestionRequestIdRef.current += 1;

      setSuggestions([]);
      setSearchResults([]);

      setIsLoading(false);
      setIsSuggestionsLoading(false);

      return;
    }

    // ==========================================================
    // SUGGESTIONS
    // ==========================================================

    suggestionTimeoutRef.current =
      setTimeout(() => {
        getSuggestions(trimmedText);
      }, 250);

    // ==========================================================
    // SEARCH
    // ==========================================================

    searchTimeoutRef.current =
      setTimeout(() => {
        searchFood(trimmedText, true);
      }, 450);
  };

  // ============================================================
  // KEYBOARD SEARCH
  // ============================================================

  const handleSubmitSearch = () => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(
        searchTimeoutRef.current
      );
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    setSuggestions([]);
    setShowSuggestions(false);

    Keyboard.dismiss();

    searchFood(trimmedQuery, true);
  };

  // ============================================================
  // SELECT SUGGESTION
  // ============================================================

  const selectSuggestion = (
    suggestion
  ) => {
    const selected =
      String(suggestion || "").trim();

    if (!selected) {
      return;
    }

    console.log(
      "SELECTED SUGGESTION =>",
      selected
    );

    if (searchTimeoutRef.current) {
      clearTimeout(
        searchTimeoutRef.current
      );
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    setQuery(selected);

    setSuggestions([]);

    setShowSuggestions(false);

    Keyboard.dismiss();

    searchFood(selected, true);
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const clearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(
        searchTimeoutRef.current
      );
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    // Invalidate old API calls.
    searchRequestIdRef.current += 1;

    suggestionRequestIdRef.current += 1;

    setQuery("");
    setSuggestions([]);
    setSearchResults([]);

    setIsLoading(false);
    setIsSuggestionsLoading(false);

    setShowSuggestions(true);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = async () => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      return;
    }

    try {
      setRefreshing(true);

      await searchFood(
        trimmedQuery,
        false
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // OPEN DISH DETAIL
  // ============================================================

  const openDish = (item) => {
    console.log(
      "===================================="
    );

    console.log(
      "OPEN DISH"
    );

    console.log(
      "DISH OBJECT =>",
      item
    );

    console.log(
      "===================================="
    );

    try {
      // IMPORTANT:
      // This app uses Expo Router.
      // Do NOT use navigation.navigate().
      //
      // Your screen file is:
      // src/app/Dish_detail_screen.jsx
      //
      // Expo Router route:
      // /Dish_detail_screen

      router.push({
        pathname:
          "/Dish_detail_screen",

        params: {
          dish: JSON.stringify(item),
        },
      });
    } catch (error) {
      console.log(
        "DISH NAVIGATION ERROR =>",
        error
      );
    }
  };

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(
          searchTimeoutRef.current
        );
      }

      if (suggestionTimeoutRef.current) {
        clearTimeout(
          suggestionTimeoutRef.current
        );
      }

      searchRequestIdRef.current += 1;

      suggestionRequestIdRef.current += 1;
    };
  }, []);

  // ============================================================
  // RENDER SUGGESTION
  // ============================================================

  const renderSuggestion = ({
    item,
    index,
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.suggestionItem,
          {
            backgroundColor:
              colors.card,

            borderBottomColor:
              colors.border,
          },
        ]}
        onPress={() =>
          selectSuggestion(item)
        }
      >
        <View
          style={[
            styles.suggestionIcon,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.orange}
          />
        </View>

        <Text
          style={[
            styles.suggestionText,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {String(item)}
        </Text>

        <Ionicons
          name="arrow-up-outline"
          size={18}
          color={colors.muted}
          style={{
            transform: [
              {
                rotate: "45deg",
              },
            ],
          }}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDER FOOD
  // ============================================================

  const renderFood = ({
    item,
    index,
  }) => {
    const imageUrl =
      getImageUrl(
        item?.image ??
          item?.image_url ??
          item?.imageUrl ??
          item?.image_urls ??
          item?.food_image ??
          item?.food_photo ??
          item?.food_image_url ??
          item?.photo
      );

    const name =
      item?.name ??
      item?.food_name ??
      item?.title ??
      "Unnamed Dish";

    const price =
      item?.price ??
      item?.food_price ??
      item?.amount ??
      item?.selling_price ??
      0;

    const category =
      item?.category ??
      item?.food_category ??
      "";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.foodCard,
          {
            backgroundColor:
              colors.card,

            borderColor:
              colors.border,
          },
        ]}
        onPress={() =>
          openDish(item)
        }
      >
        {/* ================================================= */}
        {/* IMAGE */}
        {/* ================================================= */}

        <View
          style={styles.imageContainer}
        >
          {imageUrl ? (
            <Image
              source={{
                uri: imageUrl,
              }}
              style={
                styles.foodImage
              }
              resizeMode="cover"
              onError={(error) => {
                console.log(
                  "FOOD IMAGE ERROR =>",
                  error?.nativeEvent
                );
              }}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Ionicons
                name="fast-food-outline"
                size={30}
                color={colors.orange}
              />
            </View>
          )}
        </View>

        {/* ================================================= */}
        {/* INFO */}
        {/* ================================================= */}

        <View
          style={styles.foodInfo}
        >
          <Text
            style={[
              styles.foodName,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {String(name)}
          </Text>

          <Text
            style={[
              styles.foodPrice,
              {
                color:
                  colors.orange,
              },
            ]}
          >
            ₹{String(price)}
          </Text>

          {category ? (
            <Text
              style={[
                styles.foodCategory,
                {
                  color:
                    colors.muted,
                },
              ]}
              numberOfLines={1}
            >
              {String(category)}
            </Text>
          ) : null}
        </View>

        {/* ================================================= */}
        {/* ARROW */}
        {/* ================================================= */}

        <View
          style={[
            styles.arrowContainer,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={
              colors.secondaryText
            }
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // EMPTY STATE
  // ============================================================

  const renderEmptyState = () => {
    const isSearching =
      query.trim().length > 0;

    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Text
          style={styles.emptyEmoji}
        >
          🔍
        </Text>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {isSearching
            ? "No results found"
            : "Start typing to search..."}
        </Text>

        {isSearching ? (
          <Text
            style={[
              styles.emptySubtitle,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Try searching for another
            dish, chef, or cuisine
          </Text>
        ) : null}
      </View>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
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

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <View
        style={styles.header}
      >
        {/* BACK BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();

            // Expo Router navigation
            router.back();
          }}
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        {/* ================================================== */}
        {/* SEARCH INPUT */}
        {/* ================================================== */}

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                colors.input,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={21}
            color={colors.orange}
            style={
              styles.searchIcon
            }
          />

          <TextInput
            ref={
              searchInputRef
            }
            style={[
              styles.searchInput,
              {
                color:
                  colors.text,
              },
            ]}
            value={query}
            onChangeText={
              handleSearchChange
            }
            placeholder="Search dishes, chefs, cuisines..."
            placeholderTextColor={
              colors.muted
            }
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={
              handleSubmitSearch
            }
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* CLEAR */}

          {query.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                clearSearch
              }
              style={
                styles.clearButton
              }
            >
              <Ionicons
                name="close"
                size={18}
                color={
                  colors.secondaryText
                }
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      {isLoading ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.orange
            }
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Searching...
          </Text>
        </View>
      ) : query.trim().length === 0 ? (
        renderEmptyState()
      ) : showSuggestions &&
        suggestions.length > 0 ? (
        /* ==================================================== */
        /* SUGGESTIONS */
        /* ==================================================== */

        <FlatList
          data={suggestions}
          keyExtractor={(
            item,
            index
          ) =>
            `${String(item)}-${index}`
          }
          renderItem={
            renderSuggestion
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          ListHeaderComponent={
            <View
              style={
                styles.suggestionHeader
              }
            >
              <Text
                style={[
                  styles.suggestionHeaderText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Suggestions
              </Text>

              {isSuggestionsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    colors.orange
                  }
                />
              ) : null}
            </View>
          }
        />
      ) : searchResults.length === 0 ? (
        /* ==================================================== */
        /* NO RESULTS */
        /* ==================================================== */

        renderEmptyState()
      ) : (
        /* ==================================================== */
        /* SEARCH RESULTS */
        /* ==================================================== */

        <FlatList
          data={
            searchResults
          }
          keyExtractor={(
            item,
            index
          ) =>
            String(
              item?.id ??
                item?.food_id ??
                item?._id ??
                index
            )
          }
          renderItem={
            renderFood
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.resultsContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                onRefresh
              }
              tintColor={
                colors.orange
              }
              colors={[
                colors.orange,
              ]}
            />
          }
          ListHeaderComponent={
            <View
              style={
                styles.resultsHeader
              }
            >
              <Text
                style={[
                  styles.resultsTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Search Results
              </Text>

              <Text
                style={[
                  styles.resultsCount,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                {
                  searchResults.length
                }{" "}
                {
                  searchResults.length ===
                  1
                    ? "result"
                    : "results"
                }
              </Text>
            </View>
          }
        />
      )}
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

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,

    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchContainer: {
    flex: 1,

    height: 48,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 15,

    paddingLeft: 12,
    paddingRight: 6,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,

    height: 48,

    fontSize: 14,

    paddingVertical: 0,
  },

  clearButton: {
    width: 38,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // LOADING
  // ============================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,

    fontSize: 14,
  },

  // ============================================================
  // EMPTY
  // ============================================================

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 56,
  },

  emptyTitle: {
    marginTop: 16,

    fontSize: 16,
    fontWeight: "600",

    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 8,

    fontSize: 13,

    textAlign: "center",

    lineHeight: 20,
  },

  // ============================================================
  // SUGGESTIONS
  // ============================================================

  suggestionHeader: {
    height: 48,

    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  suggestionHeaderText: {
    fontSize: 13,
    fontWeight: "600",
  },

  suggestionItem: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 18,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  suggestionIcon: {
    width: 36,
    height: 36,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  suggestionText: {
    flex: 1,

    fontSize: 14,
    fontWeight: "500",
  },

  // ============================================================
  // RESULTS
  // ============================================================

  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 14,
  },

  resultsTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  resultsCount: {
    fontSize: 12,
  },

  // ============================================================
  // FOOD CARD
  // ============================================================

  foodCard: {
    minHeight: 84,

    flexDirection: "row",
    alignItems: "center",

    borderRadius: 16,

    borderWidth: 1,

    marginBottom: 12,

    padding: 10,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,
    shadowRadius: 7,

    elevation: 2,
  },

  imageContainer: {
    width: 64,
    height: 64,

    borderRadius: 11,

    overflow: "hidden",
  },

  foodImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // FOOD INFO
  // ============================================================

  foodInfo: {
    flex: 1,

    paddingHorizontal: 12,
  },

  foodName: {
    fontSize: 15,

    fontWeight: "600",

    lineHeight: 20,
  },

  foodPrice: {
    marginTop: 7,

    fontSize: 14,

    fontWeight: "700",
  },

  foodCategory: {
    marginTop: 3,

    fontSize: 11,
  },

  // ============================================================
  // ARROW
  // ============================================================

  arrowContainer: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },
});

export default SearchScreen;
