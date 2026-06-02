import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useUpdateBusinessConfig } from "@/hooks/useBusinessConfig";
import { useAuthStore } from "@/stores/useAuthStore";

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

interface StepProps {
  step: number;
  total: number;
  colors: any;
  accent: string;
}

function StepIndicator({ step, total, colors, accent }: StepProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            width: i === step ? 24 : 6,
            borderRadius: 3,
            backgroundColor: i <= step ? accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color: colors.textSecondary,
        marginBottom: 6,
        letterSpacing: 0.3,
      }}
    >
      {label}
    </Text>
  );
}

interface InputFieldProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  colors: any;
  accent: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  prefix?: string;
}

function InputField({
  value,
  onChangeText,
  placeholder,
  colors,
  accent,
  keyboardType = "default",
  prefix,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: focused ? accent : colors.border,
        borderRadius: 14,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        minHeight: 52,
      }}
    >
      {prefix ? (
        <Text
          style={{ fontSize: 14, color: colors.textTertiary, marginRight: 6 }}
        >
          {prefix}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.text,
          paddingVertical: 12,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── Step 0: Nombre e info del negocio ───────────────────────────────────────

function StepInfo({
  colors,
  accent,
  form,
  setForm,
}: {
  colors: any;
  accent: string;
  form: FormState;
  setForm: (f: FormState) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <View>
        <FieldLabel label="Nombre del salón *" colors={colors} />
        <InputField
          value={form.businessName}
          onChangeText={(v) => setForm({ ...form, businessName: v })}
          placeholder="Coraline Nails"
          colors={colors}
          accent={accent}
        />
      </View>
      <View>
        <FieldLabel label="Teléfono" colors={colors} />
        <InputField
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          placeholder="55 1234 5678"
          colors={colors}
          accent={accent}
          keyboardType="phone-pad"
        />
      </View>
      <View>
        <FieldLabel label="Dirección" colors={colors} />
        <InputField
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
          placeholder="Calle, Colonia, Ciudad"
          colors={colors}
          accent={accent}
        />
      </View>
      <View>
        <FieldLabel label="Instagram (sin @)" colors={colors} />
        <InputField
          value={form.instagram}
          onChangeText={(v) => setForm({ ...form, instagram: v })}
          placeholder="coralinails_mx"
          colors={colors}
          accent={accent}
          prefix="@"
        />
      </View>
    </View>
  );
}

// ─── Step 1: Horario y días ───────────────────────────────────────────────────

function StepSchedule({
  colors,
  accent,
  form,
  setForm,
}: {
  colors: any;
  accent: string;
  form: FormState;
  setForm: (f: FormState) => void;
}) {
  function toggleDay(day: number) {
    const current = form.workDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setForm({ ...form, workDays: next });
  }

  function adjustTime(field: "openTime" | "closeTime", delta: number) {
    const current = form[field];
    const [h, m] = current.split(":").map(Number);
    const totalMins = h * 60 + m + delta;
    const clamped = Math.max(0, Math.min(23 * 60 + 30, totalMins));
    const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
    const mm = String(clamped % 60).padStart(2, "0");
    setForm({ ...form, [field]: `${hh}:${mm}` });
  }

  function formatTime(value: string) {
    const [h, m] = value.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  return (
    <View style={{ gap: 20 }}>
      {/* Días laborales */}
      <View>
        <FieldLabel label="Días de trabajo" colors={colors} />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {DAY_LABELS.map((day, index) => {
            const active = form.workDays.includes(index);
            return (
              <Pressable
                key={index}
                onPress={() => toggleDay(index)}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? accent : colors.surface,
                  borderWidth: 1.5,
                  borderColor: active ? accent : colors.border,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: active ? "#fff" : colors.textSecondary,
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Horario apertura */}
      {(["openTime", "closeTime"] as const).map((field) => (
        <View key={field}>
          <FieldLabel
            label={field === "openTime" ? "Hora de apertura" : "Hora de cierre"}
            colors={colors}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.border,
              paddingHorizontal: 4,
            }}
          >
            <Pressable
              onPress={() => adjustTime(field, -30)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 48,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="remove" size={22} color={colors.textSecondary} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {formatTime(form[field])}
            </Text>
            <Pressable
              onPress={() => adjustTime(field, 30)}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 48,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="add" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  businessName: string;
  phone: string;
  address: string;
  instagram: string;
  openTime: string;
  closeTime: string;
  workDays: number[];
}

// ─── Screen principal ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 2;

export default function SetupScreen() {
  const { colors, accent } = useTheme();
  const { setHasCompletedSetup } = useOnboardingStore();
  const { profile } = useAuthStore();
  const updateConfig = useUpdateBusinessConfig();
  const [step, setStep] = useState(0);
  const primary = accent || "#F4A99A";
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<FormState>({
    businessName: "",
    phone: "",
    address: "",
    instagram: "",
    openTime: "09:00",
    closeTime: "20:00",
    workDays: [1, 2, 3, 4, 5, 6],
  });

  const isDark = colors.background === "#000000";

  function validate(): string | null {
    if (step === 0 && !form.businessName.trim()) {
      return "El nombre del salón es obligatorio.";
    }
    if (step === 1 && form.workDays.length === 0) {
      return "Selecciona al menos un día de trabajo.";
    }
    return null;
  }

  async function handleNext() {
    const err = validate();
    if (err) {
      Alert.alert("Campo requerido", err);
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    // Último paso — guardar
    await handleSave();
  }

  async function handleSave() {
    try {
      await updateConfig.mutateAsync({
        business_name: form.businessName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        instagram_handle: form.instagram.trim(),
        open_time: form.openTime,
        close_time: form.closeTime,
        work_days: form.workDays,
      });
      setHasCompletedSetup(true);
      router.replace("/");
    } catch {
      Alert.alert(
        "Error",
        "No se pudo guardar la configuración. Inténtalo de nuevo.",
      );
    }
  }

  function handleSkip() {
    setHasCompletedSetup(true);
    router.replace("/");
  }

  const titles = ["Cuéntanos sobre tu salón", "Horario y días de atención"];
  const subtitles = [
    "Configura la información básica de tu negocio.",
    "Cuándo abres y qué días trabajas.",
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <StepIndicator
              step={step}
              total={TOTAL_STEPS}
              colors={colors}
              accent={primary}
            />
            <Pressable
              onPress={handleSkip}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Ahora no
              </Text>
            </Pressable>
          </View>

          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: isDark ? "#2A1815" : "#FFF2F0",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons
              name={step === 0 ? "storefront-outline" : "time-outline"}
              size={28}
              color={primary}
            />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 6,
              letterSpacing: -0.4,
            }}
          >
            {titles[step]}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            {subtitles[step]}
          </Text>
        </View>

        {/* Form content + botones dentro del scroll */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          }}
        >
          {step === 0 ? (
            <StepInfo
              colors={colors}
              accent={primary}
              form={form}
              setForm={setForm}
            />
          ) : (
            <StepSchedule
              colors={colors}
              accent={primary}
              form={form}
              setForm={setForm}
            />
          )}

          {/* Botón Continuar — igual que onboarding */}
          <Pressable
            onPress={handleNext}
            disabled={updateConfig.isPending}
            style={{
              width: "100%",
              alignSelf: "center",
              marginTop: 32,
              marginBottom: 16,
              backgroundColor: primary,
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            {updateConfig.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                {step < TOTAL_STEPS - 1 ? "Continuar" : "Guardar y entrar"}
              </Text>
            )}
          </Pressable>

          {step > 0 && (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              style={({ pressed }) => ({
                width: 220,
                height: 48,
                borderRadius: 14,
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                Atrás
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
