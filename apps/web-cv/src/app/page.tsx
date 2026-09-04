export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="placeholder">
      <h1>Victor Albulescu</h1>
      <p>Phase 1 placeholder — the container stack is up.</p>
      <p className="meta">Next.js {process.env.NEXT_RUNTIME ?? 'node'} · {new Date().toISOString()}</p>
    </main>
  );
}
