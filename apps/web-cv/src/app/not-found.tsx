import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page empty">
      <h1>Page not found</h1>
      <p>
        That page does not exist. <Link href="/">Back to the start</Link>.
      </p>
    </main>
  );
}
