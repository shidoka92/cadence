import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Plan, PlanBlock, PlanSession } from "@cadence/types";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";

const WEEK_MS = 7 * 864e5;
type Picked = { block: PlanBlock; session: PlanSession };
type Fields = { load: string; reps: string; rpe: string };
const num = (s: string): number | null => {
  const n = Number(s.replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) ? n : null;
};
const exerciseKey = (id: string | null, name: string) => id ?? name.trim().toLowerCase();

export default function Seance() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [fields, setFields] = useState<Record<string, Fields>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ prCount: number } | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("programs")
      .select("plan, created_at")
      .eq("student_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const p = (data?.plan as Plan) ?? null;
        setPlan(p);
        if (p && data) {
          const total = p.blocks.reduce((n, b) => n + b.weeks.length, 0);
          const elapsed = Math.floor((Date.now() - new Date(data.created_at).getTime()) / WEEK_MS) + 1;
          setCurrentWeek(Math.min(Math.max(elapsed, 1), Math.max(total, 1)));
        }
        setFetching(false);
      });
  }, [session]);

  const setField = (exId: string, key: keyof Fields, value: string) =>
    setFields((prev) => {
      const cur = prev[exId] ?? { load: "", reps: "", rpe: "" };
      return { ...prev, [exId]: { ...cur, [key]: value } };
    });

  const targetFor = (block: PlanBlock, ex: PlanSession["exercises"][number]): string => {
    const wi = block.weeks.indexOf(currentWeek);
    const cell = ex.cells[wi >= 0 ? wi : ex.cells.length - 1];
    return cell?.v ?? "—";
  };

  async function finish() {
    if (!picked || !session) return;
    const entries = picked.session.exercises
      .map((ex) => ({ ex, f: fields[ex.id] }))
      .filter(({ f }) => f && (num(f.load) !== null || num(f.reps) !== null))
      .map(({ ex, f }) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        load: num(f!.load),
        reps: num(f!.reps),
        rpe: num(f!.rpe),
      }));
    if (entries.length === 0) {
      setError("Renseigne au moins une charge ou des répétitions.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // records existants avant insertion (pour détecter les nouveaux)
    const { data: previous = [] } = await supabase
      .from("journal_entries")
      .select("exercise, exercise_id, load")
      .eq("student_id", session.user.id)
      .not("load", "is", null)
      .limit(1000);
    const bestOf = new Map<string, number>();
    for (const p of (previous ?? []) as { exercise: string; exercise_id: string | null; load: number }[]) {
      const k = exerciseKey(p.exercise_id, p.exercise);
      bestOf.set(k, Math.max(bestOf.get(k) ?? 0, Number(p.load)));
    }

    const { error: insErr } = await supabase.from("journal_entries").insert(
      entries.map((e) => ({
        student_id: session.user.id,
        session_ref: picked.session.name,
        session_id: picked.session.id,
        exercise: e.exerciseName,
        exercise_id: e.exerciseId,
        load: e.load,
        reps: e.reps,
        rpe: e.rpe,
      }))
    );
    if (insErr) {
      setSubmitting(false);
      setError("Enregistrement impossible. Réessaie.");
      return;
    }

    const prs = entries.filter(
      (e) =>
        e.load != null &&
        bestOf.has(exerciseKey(e.exerciseId, e.exerciseName)) &&
        e.load > (bestOf.get(exerciseKey(e.exerciseId, e.exerciseName)) ?? 0)
    );
    if (prs.length > 0) {
      await supabase.from("notifications").insert(
        prs.map((e) => ({
          user_id: session.user.id,
          type: "pr",
          payload: { title: `Nouveau record : ${e.load} kg au ${e.exerciseName} 🎉`, href: "/eleve/progres" },
        }))
      );
    }
    setSubmitting(false);
    setDone({ prCount: prs.length });
  }

  const sessions = useMemo(() => {
    if (!plan) return [];
    return plan.blocks.flatMap((block) => block.sessions.map((s) => ({ block, session: s })));
  }, [plan]);

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
        <Pressable
          onPress={() => (picked && !done ? setPicked(null) : router.back())}
          hitSlop={10}
          className="w-8 h-8 items-center justify-center rounded-md active:bg-hover"
        >
          <Text className="text-text text-xl">‹</Text>
        </Pressable>
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Ma séance</Text>
        {picked && !done ? <Text className="text-ghost text-xs ml-auto">Semaine {currentWeek}</Text> : null}
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : !plan || sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-center text-base">
            Aucun programme assigné — ta séance guidée apparaîtra ici une fois ton coach l&apos;a créée.
          </Text>
        </View>
      ) : done ? (
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-ok text-4xl">✓</Text>
          <Text className="text-text text-xl font-bold text-center">Séance enregistrée</Text>
          {done.prCount > 0 ? (
            <Text className="text-acid text-center">
              {done.prCount} nouveau{done.prCount > 1 ? "x" : ""} record{done.prCount > 1 ? "s" : ""} 🎉
            </Text>
          ) : null}
          <Pressable onPress={() => router.replace("/")} className="mt-4 bg-acid rounded-md px-5 py-3 active:opacity-80">
            <Text className="text-onAcid font-bold">Retour à l&apos;accueil</Text>
          </Pressable>
        </View>
      ) : !picked ? (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-2.5">
          <Text className="text-muted text-sm mb-1">Choisis la séance à réaliser :</Text>
          {sessions.map(({ block, session: s }) => (
            <Pressable
              key={s.id}
              onPress={() => setPicked({ block, session: s })}
              className="rounded-md border border-line bg-surf px-4 py-3.5 active:bg-hover"
            >
              <Text className="text-text text-sm font-semibold">{s.name}</Text>
              <Text className="text-ghost text-xs mt-0.5">
                {block.focus} · {s.exercises.length} exercices
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-4" keyboardShouldPersistTaps="handled">
          <Text className="text-text text-lg font-bold">{picked.session.name}</Text>
          {picked.session.exercises.map((ex) => (
            <View key={ex.id} className="rounded-md border border-line bg-surf p-3 gap-2.5">
              <View>
                <Text className="text-text text-sm font-medium">{ex.name}</Text>
                <Text className="text-acid text-xs mt-0.5">Cible : {targetFor(picked.block, ex)}</Text>
              </View>
              <View className="flex-row gap-2">
                {(["load", "reps", "rpe"] as const).map((key) => (
                  <View key={key} className="flex-1">
                    <Text className="text-ghost text-[10px] uppercase tracking-wider mb-1">
                      {key === "load" ? "Charge kg" : key === "reps" ? "Reps" : "RPE"}
                    </Text>
                    <TextInput
                      value={fields[ex.id]?.[key] ?? ""}
                      onChangeText={(v) => setField(ex.id, key, v)}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor="#6B747D"
                      className="bg-bg border border-line rounded px-2.5 py-2 text-text text-center"
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          {error ? <Text className="text-risk text-sm">{error}</Text> : null}

          <Pressable
            onPress={finish}
            disabled={submitting}
            className="bg-acid rounded-md px-4 py-4 items-center active:opacity-80 mt-1"
          >
            {submitting ? (
              <ActivityIndicator color="#06151F" />
            ) : (
              <Text className="text-onAcid font-bold">Terminer la séance</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
