import { notFound } from "next/navigation";
import type { Plan } from "@cadence/types";
import { createClient } from "@/lib/supabase/server";
import { getProgramAnnotations } from "@/lib/queries";
import { ProgramEditor } from "../program-editor";

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: prog } = await supabase.from("programs").select("id, title, student_id, plan").eq("id", params.id).maybeSingle();
  if (!prog) notFound();
  const { data: student } = await supabase.from("profiles").select("full_name").eq("id", prog.student_id).single();
  const plan = prog.plan as Plan;
  const annotations = await getProgramAnnotations(supabase, prog.id, plan);
  return <ProgramEditor programId={prog.id} title={prog.title} student={student?.full_name ?? "Élève"} initialPlan={plan} annotations={annotations} />;
}
