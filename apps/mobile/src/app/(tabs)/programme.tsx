import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Plan } from "@cadence/types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";

type Program = { title: string; status: string; plan: Plan };

export default function Programme() {
  const { session, loading } = useSession();
  const [fetching, setFetching] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("programs")
      .select("title, plan, status")
      .eq("student_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setProgram(data ? (data as Program) : null);
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
      <View className="px-4 py-3 border-b border-line">
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Mon programme</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : !program ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-center text-base">
            Ton coach ne t&apos;a pas encore assigné de programme.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-5">
          <View className="gap-1">
            <Text className="text-text text-2xl font-bold">{program.title}</Text>
            <Text className="text-acid text-xs uppercase tracking-[2px]">{program.status}</Text>
          </View>

          {program.plan.blocks.map((block) => (
            <View key={block.id} className="gap-3">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-text text-base font-bold uppercase tracking-wide">{block.focus}</Text>
                <Text className="text-ghost text-xs">
                  {block.weeks.length} sem
                </Text>
              </View>

              {block.sessions.map((s) => (
                <View key={s.id} className="rounded-md border border-line bg-surf overflow-hidden">
                  <Text className="text-text text-sm font-semibold px-3 py-2.5 border-b border-line bg-surf2">
                    {s.name}
                  </Text>
                  <View className="p-3 gap-3.5">
                    {s.exercises.map((ex) => (
                      <View key={ex.id} className="gap-1.5">
                        <Text className="text-text text-sm font-medium">{ex.name}</Text>
                        {ex.rule ? <Text className="text-ghost text-xs">{ex.rule}</Text> : null}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 pt-0.5">
                          {ex.cells.map((cell, i) => (
                            <View key={i} className="rounded border border-line px-2 py-1 bg-bg">
                              <Text className="text-ghost text-[9px]">S{block.weeks[i] ?? i + 1}</Text>
                              <Text className="text-text text-xs">{cell.v}</Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
