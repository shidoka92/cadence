import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/coach/sidebar";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "student") redirect("/eleve/accueil");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      <Sidebar coachName={profile?.full_name ?? "Coach"} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
