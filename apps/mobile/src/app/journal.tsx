import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";
import { getStudentJournal, type JournalEntry } from "../lib/journal";

function metrics(e: JournalEntry): string {
  const parts: string[] = [];
  if (e.load != null) parts.push(`${e.load} kg`);
  if (e.reps != null) parts.push(`${e.reps} reps`);
  if (e.rpe != null) parts.push(`RPE ${e.rpe}`);
  return parts.join(" · ") || "—";
}

export default function Journal() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!session) return;
    getStudentJournal(supabase, session.user.id).then((e) => {
      setEntries(e);
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

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-line">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-8 h-8 items-center justify-center rounded-md active:bg-hover">
          <Text className="text-text text-xl">‹</Text>
        </Pressable>
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Mon journal</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-center text-base">
            Ton journal est vide. Chaque série loguée en séance apparaîtra ici.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-2">
          {entries.map((e) => (
            <View key={e.id} className="rounded-md border border-line bg-surf px-4 py-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-text text-sm font-medium flex-1">{e.exercise}</Text>
                <Text className="text-ghost text-[10px] uppercase">{e.day} · {e.time}</Text>
              </View>
              <Text className="text-acid text-sm mt-1">{metrics(e)}</Text>
              <Text className="text-ghost text-[11px] mt-0.5">{e.sessionRef}</Text>
              {e.note ? <Text className="text-muted text-xs mt-1 italic">{e.note}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
