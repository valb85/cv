import { desc } from 'drizzle-orm';

import { deleteMessage, markMessageRead } from '@/app/admin/actions';
import { getDb } from '@/db/client';
import { messages } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const all = getDb().select().from(messages).orderBy(desc(messages.createdAt)).all();

  if (all.length === 0) {
    return (
      <main className="admin-main">
        <h1>Messages</h1>
        <p className="hint">No messages yet.</p>
      </main>
    );
  }

  return (
    <main className="admin-main">
      <h1>Messages</h1>
      {all.map((message) => (
        <section key={message.id} className={message.readAt ? 'panel' : 'panel unread'}>
          <header className="panel-head">
            <strong>
              {message.name} &lt;{message.email}&gt;
            </strong>
            <span className="panel-actions">
              <time>{message.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</time>
              {message.readAt ? null : (
                <form action={markMessageRead}>
                  <input type="hidden" name="id" value={message.id} />
                  <button type="submit" className="linkish">
                    mark read
                  </button>
                </form>
              )}
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={message.id} />
                <button type="submit" className="linkish danger">
                  delete
                </button>
              </form>
            </span>
          </header>
          <p className="message-body">{message.body}</p>
        </section>
      ))}
    </main>
  );
}
