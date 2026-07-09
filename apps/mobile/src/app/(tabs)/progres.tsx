import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";
import { getStudentProgress, getClassLeaderboard, type StudentProgress, type LeaderboardRow } from "../../lib/progress";
import { computeBadges, unlockedCount, type Badge } from "../../lib/momentum";

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1 min-w-[45%] rounded-md border border-line bg-surf px-3 py-3">
      <Text className={`text-2xl font-bold ${accent ? "text-acid" : "text-text"}`}>{value}</Text>
      <Text className="text-ghost text-[11px] leading-4 mt-1">{label}</Text>
    </View>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  if (badge.unlocked) {
    return (
      <View className="flex-1 min-w-[45%] rounded-md border border-acid/40 bg-acid/10 px-3 py-2.5">
        <Text className="text-acid text-xs font-bold">{badge.label}</Text>
        <Text className="text-muted text-[10px] leading-4 mt-1">{badge.caption}</Text>
      </View>
    );
  }
  const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));
  return (
    <View className="flex-1 min-w-[45%] rounded-md border border-line bg-surf px-3 py-2.5">
      <Text className="text-muted text-xs font-bold">{badge.label}</Text>
      <Text className="text-ghost text-[10px] mt-1">
        {badge.current}/{badge.target}
      </Text>
      <View className="h-1 bg-line rounded-full mt-2 overflow-hidden">
        <View className="h-full bg-ghost rounded-full" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function Progres() {
  const { session, loading } = useSession();
  const [fetching, setFetching] = useState(true);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    if (!session) return;
    Promise.all([getStudentProgress(supabase, session.user.id), getClassLeaderboard(supabase)]).then(([p, lb]) => {
      setProgress(p);
      setLeaderboard(lb);
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

  const badges = progress ? computeBadges({ totalSessions: progress.totalSessions, streakWeeks: progress.streak, prCount: progress.prs.length }) : [];
  const volumeTonnes = progress ? (progress.totalVolume / 1000).toFixed(1) : "0";

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-4 py-3 border-b border-line">
        <Text className="text-text text-lg font-bold uppercase tracking-[2px]">Mes progrès</Text>
      </View>

      {fetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FB2FF" />
        </View>
      ) : !progress?.hasEntries ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted text-center text-base">
            Pas encore de données. Logue tes séances pour voir tes records, ta régularité et tes jalons apparaître ici.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-5">
          {progress.recentPr ? (
            <View className="rounded-md border border-acid/40 bg-acid/10 px-4 py-3.5">
              <Text className="text-acid text-xs uppercase tracking-wider font-bold">Nouveau record 🎉</Text>
              <Text className="text-text text-base font-semibold mt-1">
                {progress.recentPr.load} kg au {progress.recentPr.name}
              </Text>
              <Text className="text-ghost text-xs mt-0.5">le {progress.recentPr.date}</Text>
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-2.5">
            <KpiTile label="Semaines actives d'affilée" value={String(progress.streak)} accent />
            <KpiTile label="Séances loguées" value={String(progress.totalSessions)} />
            <KpiTile label="Records personnels" value={String(progress.prs.length)} />
            <KpiTile label="Volume total (t)" value={volumeTonnes} />
          </View>

          <View className="gap-3">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-text text-base font-bold uppercase tracking-wide">Jalons</Text>
              <Text className="text-ghost text-xs">{unlockedCount(badges)} débloqués</Text>
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              {badges.map((b) => (
                <BadgeCard key={b.id} badge={b} />
              ))}
            </View>
          </View>

          {leaderboard.length > 1 ? (
            <View className="gap-3">
              <Text className="text-text text-base font-bold uppercase tracking-wide">Classement de classe</Text>
              <View className="rounded-md border border-line bg-surf overflow-hidden">
                {leaderboard.map((row) => (
                  <View
                    key={row.studentId}
                    className={`flex-row items-center gap-3 px-4 py-2.5 border-b border-line last:border-0 ${row.isMe ? "bg-acid/10" : ""}`}
                  >
                    <Text className={`text-sm font-bold w-6 ${row.isMe ? "text-acid" : "text-ghost"}`}>{row.position}</Text>
                    <Text className={`flex-1 text-sm ${row.isMe ? "text-text font-semibold" : "text-muted"}`}>
                      {row.name}
                      {row.isMe ? " (toi)" : ""}
                    </Text>
                    <Text className="text-ghost text-xs">{row.sessions} séances</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {progress.prs.length > 0 ? (
            <View className="gap-3">
              <Text className="text-text text-base font-bold uppercase tracking-wide">Records personnels</Text>
              <View className="rounded-md border border-line bg-surf overflow-hidden">
                {progress.prs.slice(0, 8).map((pr, i) => (
                  <View key={i} className="flex-row items-center gap-3 px-4 py-2.5 border-b border-line last:border-0">
                    <Text className="flex-1 text-text text-sm font-medium">{pr.name}</Text>
                    <Text className="text-acid text-sm font-semibold">{pr.load} kg</Text>
                    <Text className="text-ghost text-[10px] w-14 text-right">{pr.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
