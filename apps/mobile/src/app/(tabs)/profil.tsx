import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";

type SubStatus = "active" | "past_due" | "canceled" | null;

const SUB_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "text-ok" },
  past_due: { label: "En retard", className: "text-risk" },
  canceled: { label: "Annulé", className: "text-ghost" },
};

export default function Profil() {
  const { session, loading } = useSession();
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [sub, setSub] = useState<SubStatus>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
      supabase.from("subscriptions").select("status").eq("student_id", session.user.id).maybeSingle(),
    ]).then(([profRes, subRes]) => {
      const full = (profRes.data?.full_name as string) ?? "";
      setName(full);
      setInitialName(full);
      setSub((subRes.data?.status as SubStatus) ?? null);
      setFetching(false);
    });
  }, [session]);

  async function saveName() {
    if (!session || saving || name.trim() === "" || name.trim() === initialName) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", session.user.id);
    setSaving(false);
    if (!error) {
      setInitialName(name.trim());
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1FB2FF" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  const subMeta = sub ? SUB_LABEL[sub] : null;
  const canSave = name.trim() !== "" && name.trim() !== initialName;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-4 py-3 border-b border-line">
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Profil</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-5">
          <View className="rounded-md border border-line bg-surf p-4 gap-3">
            <Text className="text-ghost text-[11px] uppercase tracking-wider">Nom</Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setSaved(false);
              }}
              placeholder="Ton nom"
              placeholderTextColor="#6B747D"
              className="bg-bg border border-line rounded-md px-3 py-2.5 text-text"
            />
            <Text className="text-muted text-xs">{session.user.email}</Text>
            <Pressable
              onPress={saveName}
              disabled={!canSave || saving}
              className={`rounded-md px-4 py-3 items-center ${canSave ? "bg-acid" : "bg-surf border border-line"} active:opacity-80`}
            >
              {saving ? (
                <ActivityIndicator color="#06151F" />
              ) : (
                <Text className={canSave ? "text-onAcid font-bold" : "text-ghost font-semibold"}>
                  {saved ? "Enregistré ✓" : "Enregistrer"}
                </Text>
              )}
            </Pressable>
          </View>

          <View className="rounded-md border border-line bg-surf p-4 gap-2">
            <View className="flex-row items-center">
              <Text className="text-ghost text-[11px] uppercase tracking-wider flex-1">Abonnement</Text>
              {subMeta ? <Text className={`text-xs font-bold ${subMeta.className}`}>{subMeta.label}</Text> : null}
            </View>
            <Text className="text-muted text-sm">
              {!sub
                ? "Aucun abonnement actif. Ton coach peut t'envoyer un lien de paiement."
                : sub === "active"
                  ? "Ton abonnement est actif."
                  : sub === "past_due"
                    ? "Ton dernier paiement a échoué — vérifie ton moyen de paiement."
                    : "Ton abonnement n'est plus actif."}
            </Text>
          </View>

          <Pressable
            onPress={() => supabase.auth.signOut()}
            className="rounded-md border border-line bg-surf px-4 py-3.5 items-center active:bg-hover"
          >
            <Text className="text-text font-semibold">Se déconnecter</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
