import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";
import { getStudentHome, type StudentHome } from "../../lib/home";
import { getTodayCheckin, readinessVerdict } from "../../lib/readiness";

const TONE_TEXT = { ok: "text-ok", warn: "text-warn", risk: "text-risk" } as const;

export default function Accueil() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [home, setHome] = useState<StudentHome | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([getStudentHome(supabase, session.user.id), getTodayCheckin(supabase, session.user.id)]).then(([h, c]) => {
      setHome(h);
      setReadiness(c?.score ?? null);
      setFetching(false);
    });
  }, [session]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1FB2FF" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  const firstName = home?.name.split(" ")[0] ?? "!";
  const verdict = readiness != null ? readinessVerdict(readiness) : null;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-8 pb-8 gap-5">
        <View className="gap-1">
          <Text className="text-acid text-xs uppercase tracking-[3px]">Cadence</Text>
          <Text className="text-text text-3xl font-bold">
            Salut <Text className="text-acid">{firstName}</Text>
          </Text>
        </View>

        {fetching ? (
          <ActivityIndicator color="#1FB2FF" className="mt-6" />
        ) : (
          <>
            <Pressable
              onPress={() => router.push("/seance")}
              className="bg-acid rounded-md px-4 py-4 items-center active:opacity-80"
            >
              <Text className="text-onAcid font-bold text-base">Démarrer une séance</Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push("/signal")}
                className="flex-1 rounded-md border border-line bg-surf p-4 active:bg-hover"
              >
                <Text className="text-ghost text-[11px] uppercase tracking-wider">Ma forme</Text>
                {readiness != null && verdict ? (
                  <>
                    <Text className={`text-3xl font-bold mt-1 ${TONE_TEXT[verdict.tone]}`}>{readiness}</Text>
                    <Text className={`text-xs ${TONE_TEXT[verdict.tone]}`}>{verdict.label}</Text>
                  </>
                ) : (
                  <Text className="text-acid text-sm mt-2">Faire mon check-in →</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push("/planning")}
                className="flex-1 rounded-md border border-line bg-surf p-4 active:bg-hover"
              >
                <Text className="text-ghost text-[11px] uppercase tracking-wider">Prochaine séance</Text>
                {home?.nextSession ? (
                  <>
                    <Text className="text-text text-sm font-semibold mt-1" numberOfLines={1}>
                      {home.nextSession.title}
                    </Text>
                    <Text className="text-acid text-xs mt-0.5">
                      {home.nextSession.day} · {home.nextSession.meta}
                    </Text>
                  </>
                ) : (
                  <Text className="text-muted text-sm mt-2">Rien de planifié</Text>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/programme")}
              className="rounded-md border border-line bg-surf p-4 active:bg-hover"
            >
              <View className="flex-row items-center">
                <Text className="text-ghost text-[11px] uppercase tracking-wider flex-1">Mon programme</Text>
                {home?.program ? (
                  <Text className="text-acid text-[10px] uppercase tracking-wider">{home.program.status}</Text>
                ) : null}
              </View>
              {home?.program ? (
                <Text className="text-text text-base font-semibold mt-1">{home.program.title}</Text>
              ) : (
                <Text className="text-muted text-sm mt-1">Aucun programme assigné pour le moment.</Text>
              )}
            </Pressable>

            {home?.lastMessage ? (
              <Pressable
                onPress={() => router.push("/messages")}
                className="rounded-md border border-line bg-surf p-4 active:bg-hover"
              >
                <Text className="text-ghost text-[11px] uppercase tracking-wider">
                  {home.lastMessage.fromCoach ? "Message de ton coach" : "Ton dernier message"} · {home.lastMessage.time}
                </Text>
                <Text className="text-text text-sm mt-1" numberOfLines={2}>
                  {home.lastMessage.body}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.push("/journal")}
              className="rounded-md border border-line bg-surf px-4 py-3.5 flex-row items-center active:bg-hover"
            >
              <Text className="text-text text-sm font-semibold flex-1">Mon journal d&apos;entraînement</Text>
              <Text className="text-ghost text-lg">›</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
