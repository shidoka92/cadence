import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";
import { getStudentPlanning, type UpcomingSession } from "../lib/home";

export default function Planning() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    if (!session) return;
    getStudentPlanning(supabase, session.user.id).then((s) => {
      setSessions(s);
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
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Planning</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-center text-base">
            Aucune séance planifiée dans les deux prochaines semaines.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-2.5">
          {sessions.map((s) => (
            <View key={s.id} className="flex-row items-center gap-3 rounded-md border border-line bg-surf px-4 py-3.5">
              <View className="items-center w-10">
                <Text className="text-acid text-xs font-bold uppercase">{s.day}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{s.title}</Text>
                <Text className="text-ghost text-xs mt-0.5">{s.meta}</Text>
              </View>
              <View className={`rounded px-2 py-1 ${s.type === "cours" ? "bg-acid/15" : "bg-violet/15"}`}>
                <Text className={`text-[10px] font-bold uppercase ${s.type === "cours" ? "text-acid" : "text-violet"}`}>
                  {s.type === "cours" ? "Cours" : "Ouv."}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
