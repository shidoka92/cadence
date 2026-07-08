import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";

export default function Login() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <View className="flex-1 bg-bg" />;
  if (session) return <Redirect href="/" />;

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (authError) setError("Identifiants incorrects.");
    else router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5 justify-center gap-4">
        <Text className="text-acid text-2xl font-bold uppercase tracking-[3px]">Cadence</Text>
        <Text className="text-muted text-base mb-2">Connecte-toi à ton espace élève.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8C969F"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className="bg-surf border border-line rounded-md px-3 py-3 text-text"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor="#8C969F"
          secureTextEntry
          className="bg-surf border border-line rounded-md px-3 py-3 text-text"
        />

        {error && <Text className="text-risk text-sm">{error}</Text>}

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          className="bg-acid rounded-md px-4 py-3.5 items-center active:opacity-80"
        >
          {submitting ? (
            <ActivityIndicator color="#06151F" />
          ) : (
            <Text className="text-onAcid font-bold">Se connecter</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
