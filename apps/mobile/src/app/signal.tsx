import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/use-session";
import {
  computeReadiness,
  readinessVerdict,
  getTodayCheckin,
  getRecentCheckins,
  saveCheckin,
  type Checkin,
  type ReadinessInputs,
} from "../lib/readiness";

const TONE_TEXT = { ok: "text-ok", warn: "text-warn", risk: "text-risk" } as const;
const TONE_BG = { ok: "bg-ok", warn: "bg-warn", risk: "bg-risk" } as const;

function Scale({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-text text-sm font-medium flex-1">{label}</Text>
        <Text className="text-ghost text-[10px]">{hint}</Text>
      </View>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            className={`flex-1 items-center py-2.5 rounded-md border ${
              value === n ? "bg-acid border-acid" : "bg-surf border-line"
            } active:opacity-80`}
          >
            <Text className={value === n ? "text-onAcid font-bold" : "text-muted"}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function Signal() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [today, setToday] = useState<Checkin | null>(null);
  const [recent, setRecent] = useState<Checkin[]>([]);
  const [editing, setEditing] = useState(false);

  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [mood, setMood] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([getTodayCheckin(supabase, session.user.id), getRecentCheckins(supabase, session.user.id, 7)]).then(([t, r]) => {
      setToday(t);
      setRecent(r);
      setEditing(!t); // si pas de check-in du jour → formulaire ouvert
      setFetching(false);
    });
  }, [session]);

  const inputs: ReadinessInputs = useMemo(() => {
    const h = sleepHours.trim() === "" ? null : Number(sleepHours.replace(",", "."));
    return { sleepHours: h != null && Number.isFinite(h) ? h : null, sleepQuality, energy, soreness, mood };
  }, [sleepHours, sleepQuality, energy, soreness, mood]);
  const preview = computeReadiness(inputs);
  const previewVerdict = readinessVerdict(preview);

  async function submit() {
    if (!session || saving) return;
    setSaving(true);
    setError(null);
    const err = await saveCheckin(supabase, session.user.id, inputs);
    if (err) {
      setError(err);
      setSaving(false);
      return;
    }
    const [t, r] = await Promise.all([getTodayCheckin(supabase, session.user.id), getRecentCheckins(supabase, session.user.id, 7)]);
    setToday(t);
    setRecent(r);
    setEditing(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1FB2FF" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  const maxRecent = Math.max(100, ...recent.map((c) => c.score));

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-line">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-8 h-8 items-center justify-center rounded-md active:bg-hover">
          <Text className="text-text text-xl">‹</Text>
        </Pressable>
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Signal</Text>
        <Text className="text-ghost text-xs ml-auto">Forme du jour</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-5" keyboardShouldPersistTaps="handled">
          {today && !editing ? (
            <View className="rounded-md border border-line bg-surf p-5 items-center gap-1">
              <Text className="text-ghost text-[11px] uppercase tracking-wider">Ta readiness aujourd&apos;hui</Text>
              <Text className={`text-5xl font-bold ${TONE_TEXT[readinessVerdict(today.score).tone]}`}>{today.score}</Text>
              <Text className={`text-sm font-semibold ${TONE_TEXT[readinessVerdict(today.score).tone]}`}>
                {readinessVerdict(today.score).label}
              </Text>
              <Text className="text-muted text-xs text-center mt-1">{readinessVerdict(today.score).advice}</Text>
              <Pressable onPress={() => setEditing(true)} className="mt-3 bg-surf border border-line rounded-md px-4 py-2 active:bg-hover">
                <Text className="text-text text-sm">Modifier</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4">
              <View className="gap-2">
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-text text-sm font-medium flex-1">Heures de sommeil</Text>
                  <Text className="text-ghost text-[10px]">optimal 7-9 h</Text>
                </View>
                <TextInput
                  value={sleepHours}
                  onChangeText={setSleepHours}
                  keyboardType="numeric"
                  placeholder="ex. 7.5"
                  placeholderTextColor="#6B747D"
                  className="bg-surf border border-line rounded-md px-3 py-2.5 text-text"
                />
              </View>
              <Scale label="Qualité du sommeil" hint="1 mauvais · 5 excellent" value={sleepQuality} onChange={setSleepQuality} />
              <Scale label="Énergie" hint="1 épuisé · 5 en pleine forme" value={energy} onChange={setEnergy} />
              <Scale label="Courbatures" hint="1 frais · 5 très courbaturé" value={soreness} onChange={setSoreness} />
              <Scale label="Humeur" hint="1 basse · 5 au top" value={mood} onChange={setMood} />

              <View className="flex-row items-center gap-3 rounded-md border border-line bg-surf px-4 py-3">
                <Text className={`text-3xl font-bold ${TONE_TEXT[previewVerdict.tone]}`}>{preview}</Text>
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${TONE_TEXT[previewVerdict.tone]}`}>{previewVerdict.label}</Text>
                  <Text className="text-muted text-xs">{previewVerdict.advice}</Text>
                </View>
              </View>

              {error ? <Text className="text-risk text-sm">{error}</Text> : null}

              <Pressable onPress={submit} disabled={saving} className="bg-acid rounded-md px-4 py-4 items-center active:opacity-80">
                {saving ? <ActivityIndicator color="#06151F" /> : <Text className="text-onAcid font-bold text-base">Enregistrer ma forme</Text>}
              </Pressable>
            </View>
          )}

          {recent.length > 0 ? (
            <View className="gap-3">
              <Text className="text-text text-base font-bold uppercase tracking-wide">7 derniers jours</Text>
              <View className="flex-row items-end justify-between gap-1.5 h-28 rounded-md border border-line bg-surf px-3 py-3">
                {[...recent].reverse().map((c) => {
                  const tone = readinessVerdict(c.score).tone;
                  const h = Math.max(6, Math.round((c.score / maxRecent) * 74));
                  return (
                    <View key={c.date} className="flex-1 items-center gap-1">
                      <Text className="text-ghost text-[9px]">{c.score}</Text>
                      <View className={`w-full rounded-sm ${TONE_BG[tone]}`} style={{ height: h }} />
                      <Text className="text-ghost text-[9px]">{c.date.slice(8, 10)}/{c.date.slice(5, 7)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text className="text-muted text-xs">
              Ton historique de forme apparaîtra ici jour après jour. Un check-in par jour suffit.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
