import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";
import { getThread, sendMessage, type ChatMessage } from "../../lib/messages";

export default function Messages() {
  const { session, loading } = useSession();
  const [fetching, setFetching] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("Ton coach");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!session) return;
    getThread(supabase, session.user.id).then((t) => {
      setCoachId(t.coachId);
      setCoachName(t.coachName);
      setMessages(t.messages);
      setFetching(false);
    });
  }, [session]);

  async function send() {
    if (!session || !coachId || sending) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const err = await sendMessage(supabase, coachId, session.user.id, body);
    if (err) {
      setError(err);
      setSending(false);
      return;
    }
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, fromCoach: false, body, createdAt: new Date().toISOString() }]);
    setDraft("");
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1FB2FF" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="px-4 py-3 border-b border-line">
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Messages</Text>
        <Text className="text-ghost text-xs mt-0.5">{coachName}</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {fetching ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1FB2FF" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName="px-4 py-4 gap-2.5"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 ? (
              <Text className="text-muted text-center text-sm mt-8">
                Aucun message. Écris à ton coach pour démarrer la conversation.
              </Text>
            ) : (
              messages.map((m) => (
                <View
                  key={m.id}
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 ${
                    m.fromCoach ? "self-start bg-surf border border-line" : "self-end bg-acid"
                  }`}
                >
                  <Text className={m.fromCoach ? "text-text text-sm" : "text-onAcid text-sm"}>{m.body}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {error ? <Text className="text-risk text-sm px-4 pb-1">{error}</Text> : null}

        {coachId ? (
          <View className="flex-row items-end gap-2 px-4 py-3 border-t border-line">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Écris un message…"
              placeholderTextColor="#6B747D"
              multiline
              className="flex-1 bg-surf border border-line rounded-md px-3 py-2.5 text-text max-h-24"
            />
            <Pressable
              onPress={send}
              disabled={sending || draft.trim() === ""}
              className={`rounded-md px-4 py-2.5 ${draft.trim() === "" ? "bg-surf border border-line" : "bg-acid"} active:opacity-80`}
            >
              {sending ? (
                <ActivityIndicator color="#06151F" />
              ) : (
                <Text className={draft.trim() === "" ? "text-ghost font-semibold" : "text-onAcid font-bold"}>Envoyer</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="px-4 py-3 border-t border-line">
            <Text className="text-muted text-sm text-center">Aucun coach associé à ton compte pour l&apos;instant.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
