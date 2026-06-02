import { View, Text, Pressable, Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useOnboardingStore } from "@/stores/useOnboardingStore";

const SLIDES = [
  {
    icon: "calendar-outline" as const,
    title: "Agenda sin estrés",
    subtitle:
      "Registra y sigue todas tus citas con tu equipo en tiempo real. Nunca más perder una clienta.",
    color: "#F4A99A",
    bg: "#FFF2F0",
    bgDark: "#2A1815",
  },
  {
    icon: "people-outline" as const,
    title: "Conoce a tus clientas",
    subtitle:
      "Historial de visitas, preferencias, cumpleaños y notas especiales de cada una.",
    color: "#C4B5FD",
    bg: "#F5F0FF",
    bgDark: "#1E1A2E",
  },
  {
    icon: "card-outline" as const,
    title: "Finanzas claras",
    subtitle:
      "Ingresos, gastos y cierre de caja diario. Sabe exactamente cómo va tu negocio.",
    color: "#6EE7B7",
    bg: "#F0FFF8",
    bgDark: "#122A1E",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Todo en un lugar",
    subtitle:
      "Inventario, galería de diseños, estadísticas y tu equipo. Coraline Nails, hecho para ti.",
    color: "#F4A99A",
    bg: "#FFF2F0",
    bgDark: "#2A1815",
  },
];

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const { setHasSeenOnboarding } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const slideBg = isDark ? slide.bgDark : slide.bg;

  function animateTo(nextIndex: number) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setIndex(nextIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }

  function handleNext() {
    if (!isLast) {
      animateTo(index + 1);
    } else {
      finish();
    }
  }

  function handlePrev() {
    if (index > 0) animateTo(index - 1);
  }

  function finish() {
    setHasSeenOnboarding(true);
    router.replace("/");
  }

  function handleSkip() {
    setHasSeenOnboarding(true);
    router.replace("/");
  }

  return (
    <View
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: colors.background,
      }}
    >
      {/* Omitir */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 24,
          right: 24,
          zIndex: 20,
          elevation: 20,
          minHeight: 40,
          alignItems: "flex-end",
        }}
      >
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={16}>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Omitir
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top + 72,
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            width: "100%",
            opacity: fadeAnim,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 48,
              backgroundColor: slideBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              shadowColor: slide.color,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.22,
              shadowRadius: 32,
              elevation: 8,
            }}
          >
            <Ionicons name={slide.icon} size={72} color={slide.color} />
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {slide.title}
          </Text>

          <Text
            style={{
              fontSize: 16,
              lineHeight: 26,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            {slide.subtitle}
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 40 }}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 8,
                  width: i === index ? 28 : 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === index ? slide.color : isDark ? "#444" : "#DDD",
                }}
              />
            ))}
          </View>

          {/* Botón Siguiente */}
          <Pressable
            onPress={handleNext}
            style={{
              width: 220,
              alignSelf: "center",
              marginTop: 32,
              marginBottom: 16,
              backgroundColor: slide.color,
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {isLast ? "Comenzar" : "Siguiente"}
            </Text>
          </Pressable>

          {/* Botón Atrás */}
          {index > 0 && (
            <Pressable
              onPress={handlePrev}
              style={({ pressed }) => ({
                width: 220,
                height: 48,
                borderRadius: 14,
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: isDark ? "#555" : "#CCC",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: isDark ? "#fff" : "#333",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                Atrás
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
