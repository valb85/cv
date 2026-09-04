import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/LoginForm';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect('/admin');
  }

  return (
    <main className="admin admin-login">
      <h1>Sign in</h1>
      <LoginForm />
    </main>
  );
}
