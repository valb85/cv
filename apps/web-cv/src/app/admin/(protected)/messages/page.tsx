import { desc } from 'drizzle-orm';

import { deleteMessage, markMessageRead } from '@/app/admin/actions';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getDb } from '@/db/client';
import { messages } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const all = getDb().select().from(messages).orderBy(desc(messages.createdAt)).all();

  return (
    <>
      <AdminHeader eyebrow="Inbox" title="Messages" />

      {all.length === 0 ? (
        <section className="panel">
          <p className="hint">No messages yet.</p>
        </section>
      ) : (
        all.map((message) => (
          <section key={message.id} className={message.readAt ? 'panel' : 'panel unread'}>
            <div className="panel-head">
              <h2>
                {message.name} <span className="from">&lt;{message.email}&gt;</span>
              </h2>
              <span className="panel-action">
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
            </div>
            <p className="message-body">{message.body}</p>
          </section>
        ))
      )}
    </>
  );
}
