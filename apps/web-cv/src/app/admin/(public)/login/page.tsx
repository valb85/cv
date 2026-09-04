import { redirect } from 'next/navigation';

import { Icon } from '@/components/Icon';
import { LoginForm } from '@/components/admin/LoginForm';
import { adminPath } from '@/lib/admin-path';
import { getCurrentUser } from '@/lib/auth';

import '../../admin.css';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect(adminPath());
  }

  return (
    <main className="admin admin-login">
      <section className="panel">
        <div className="panel-head">
          <span className="panel-icon">
            <Icon name="user" size={20} />
          </span>
          <h2>Sign in</h2>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
