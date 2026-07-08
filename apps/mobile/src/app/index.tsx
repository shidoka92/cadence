import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";

export default function Accueil() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.full_name ?? null));
  }, [session]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1FB2FF" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5 pt-8 gap-2">
        <Text className="text-acid text-xs uppercase tracking-[3px]">Cadence</Text>
        <Text className="text-text text-3xl font-bold">Salut {name ?? "!"}</Text>
        <Text className="text-muted text-base leading-6">
          Ton espace élève arrive bientôt. Le squelette mobile est en ligne : design Arena, session Supabase et navigation prêts.
        </Text>

        <View className="mt-8 gap-3">
          <Pressable
            onPress={() => router.push("/programme")}
            className="bg-acid rounded-md px-4 py-3.5 items-center active:opacity-80"
          >
            <Text className="text-onAcid font-bold">Voir mon programme</Text>
          </Pressable>
          <Pressable
            onPress={() => supabase.auth.signOut()}
            className="self-start bg-surf border border-line rounded-md px-4 py-2.5 active:bg-hover"
          >
            <Text className="text-text text-sm">Se déconnecter</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
