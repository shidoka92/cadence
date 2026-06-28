import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { hostOpenSession } from "../actions";

export default function HeberberSeancePage() {
  return (
    <div className="px-7 py-6 max-w-md">
      <div className="text-xs text-muted mb-4"><Link href="/eleve/planning" className="text-acid">Planning</Link> › Héberger une séance</div>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-6">Héberger une séance ouverte</h1>

      <form action={hostOpenSession} className="space-y-4">
        <Input name="title" placeholder="Titre (ex: Jambes · gros volume)" required />
        <div className="flex gap-3">
          <Input name="date" type="date" required className="flex-1" />
          <Input name="time" type="time" defaultValue="18:00" required className="flex-1" />
        </div>
        <div className="flex gap-3">
          <Input name="slots" type="number" min="1" defaultValue="2" placeholder="Places" className="flex-1" />
          <Input name="level" placeholder="Niveau (ex: Intermédiaire)" className="flex-1" />
        </div>
        <div className="flex gap-2.5 pt-2">
          <Button type="submit">Créer la séance</Button>
          <Link href="/eleve/planning"><Button type="button" variant="secondary">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
