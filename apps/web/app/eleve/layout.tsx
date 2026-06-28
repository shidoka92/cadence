import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/components/student/sidebar";

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, coach_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect("/dashboard");

  const { data: coach } = profile.coach_id
    ? await supabase.from("profiles").select("full_name").eq("id", profile.coach_id).single()
    : { data: null };

  return (
    <div className="min-h-screen flex bg-bg">
      <StudentSidebar studentName={profile?.full_name ?? "Élève"} coachName={coach?.full_name} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
