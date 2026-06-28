import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Avatar, KpiTile, HealthScore } from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ghost mb-3">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

export default function Showcase() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-1">Arena · Composants</h1>
      <p className="text-muted text-sm mb-10">Bibliothèque UI — assemblée pour bâtir les écrans.</p>

      <Section title="Boutons">
        <Button>+ Nouveau programme</Button>
        <Button variant="secondary">Marquer fait</Button>
        <Button variant="ghost">Aperçu</Button>
      </Section>

      <Section title="Badges & chips">
        <Badge variant="done">✓ fait</Badge>
        <Badge variant="now">aujourd&apos;hui</Badge>
        <Badge>à venir</Badge>
        <Badge variant="cours">cours</Badge>
        <Badge variant="open">ouverte</Badge>
        <Badge variant="warn">à surveiller</Badge>
        <Badge variant="risk">signalée</Badge>
      </Section>

      <Section title="Tuiles KPI">
        <div className="w-44"><KpiTile label="Élèves actifs" value="24" trend="↑ +2 ce mois" /></div>
        <div className="w-44"><KpiTile label="Revenus" value="1896€" accent trend="↑ +79€ / mois" /></div>
      </Section>

      <Section title="Carte + Health Score">
        <Card className="w-72">
          <CardHeader><CardTitle>Élèves à risque</CardTitle><Badge variant="warn" className="ml-auto">rétention</Badge></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-28"><HealthScore score={38} /></div>
              <div><div className="font-display text-sm font-semibold uppercase">Sofia D.</div><div className="text-[11px] text-muted">9 j sans séance</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28"><HealthScore score={74} /></div>
              <div><div className="font-display text-sm font-semibold uppercase">Lucas M.</div><div className="text-[11px] text-muted">progression en baisse</div></div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Champs + Avatar">
        <div className="w-72"><Input placeholder="Rechercher un élève…" /></div>
        <Avatar initials="SB" className="w-10 h-10" />
      </Section>
    </main>
  );
}
