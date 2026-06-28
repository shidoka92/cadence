export default function SuccesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-sm w-full bg-surf border border-line rounded-lg p-6 text-center">
        <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-2">Abonnement activé 🎉</h1>
        <p className="text-sm text-muted">Tu vas recevoir un email de confirmation de Stripe. Ton coach est prévenu.</p>
      </div>
    </div>
  );
}
