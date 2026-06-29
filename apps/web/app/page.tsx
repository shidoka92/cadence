import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Activity, CreditCard, Users2, MessageSquare, CalendarRange, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: FileText,
    title: "Programmes périodisés",
    description: "Blocs, séances, exercices, charges — construis le plan complet de tes élèves, avec des règles auto et des overrides ciblés.",
  },
  {
    icon: Activity,
    title: "Health Score réel",
    description: "Calculé depuis l'assiduité, l'adhérence au plan, la réactivité aux messages et la progression des charges — pas un chiffre inventé.",
  },
  {
    icon: CreditCard,
    title: "Paiements & commission",
    description: "Connecte Stripe une fois. Abonnements et cours payants encaissés automatiquement, commission prélevée sans facture à envoyer.",
  },
  {
    icon: Users2,
    title: "Espace élève inclus",
    description: "Programme, journal d'entraînement, messagerie et planning — tes élèves ont leur propre accès, sans app à part.",
  },
];

const STEPS = [
  { n: "01", title: "Crée ton espace coach", description: "Inscription gratuite, aucune carte requise pour démarrer." },
  { n: "02", title: "Invite tes élèves", description: "Un lien unique par élève — ils créent leur compte en 30 secondes." },
  { n: "03", title: "Pilote, encaisse", description: "Programmes, suivi, messages, et paiements automatisés au même endroit." },
];

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    redirect(profile?.role === "student" ? "/eleve/accueil" : "/dashboard");
  }

  return (
    <main className="bg-bg text-text">
      <header className="flex items-center gap-4 px-4 md:px-10 py-5 border-b border-line max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-acid" />
          <span className="font-display font-bold text-xl uppercase tracking-wider">Cadence</span>
        </div>
        <nav className="ml-auto flex items-center gap-2.5">
          <Link href="/login"><Button variant="ghost">Se connecter</Button></Link>
          <Link href="/inscription"><Button>Créer mon espace</Button></Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-10 pt-16 pb-14">
        <div className="h-1 w-16 caution-stripe rounded-full mb-6" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">Pour les coachs sportifs indépendants</span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight leading-[1.05] mt-3 max-w-3xl">
          Pilote tes élèves.<br />Encaisse sans y penser.
        </h1>
        <p className="text-muted text-base md:text-lg mt-5 max-w-xl leading-relaxed">
          Cadence remplace le tableur, les programmes envoyés par PDF et les relances de paiement manuelles —
          une seule plateforme pour les programmes, le suivi réel de tes élèves, et les abonnements encaissés automatiquement.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-7">
          <Link href="/inscription"><Button size="md" className="px-6">Créer mon espace coach <ArrowRight size={15} className="inline ml-1.5" /></Button></Link>
          <Link href="/login"><Button variant="secondary">J&apos;ai déjà un compte</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-10 py-14 border-t border-line">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ghost mb-6">Ce qui est déjà dans l&apos;outil</h2>
        <div className="grid sm:grid-cols-2 gap-3.5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surf border border-line rounded-lg p-5">
              <div className="w-10 h-10 rounded-md bg-acid/15 text-acid flex items-center justify-center mb-3.5">
                <f.icon size={18} />
              </div>
              <div className="font-display text-base font-semibold uppercase tracking-wide mb-1.5">{f.title}</div>
              <p className="text-sm text-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-10 py-14 border-t border-line">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ghost mb-6">Comment ça marche</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-display text-3xl font-bold text-acid mb-2">{s.n}</div>
              <div className="font-display text-sm font-semibold uppercase tracking-wide mb-1.5">{s.title}</div>
              <p className="text-sm text-muted leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-10 py-14 border-t border-line flex flex-col items-center text-center">
        <CalendarRange size={28} className="text-acid mb-4" />
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight mb-3">Prêt à arrêter le tableur ?</h2>
        <p className="text-muted text-sm max-w-md mb-6">Crée ton espace en moins de deux minutes, invite ton premier élève, et garde un œil sur tout depuis un seul endroit.</p>
        <Link href="/inscription"><Button className="px-6">Créer mon espace coach</Button></Link>
      </section>

      <footer className="max-w-6xl mx-auto px-4 md:px-10 py-8 border-t border-line flex items-center flex-wrap gap-3 text-[11px] text-ghost font-mono uppercase tracking-wider">
        <span className="flex items-center gap-2"><MessageSquare size={13} /> Cadence</span>
        <span className="ml-auto">© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
