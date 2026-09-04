/** The eyebrow + title pair at the top of every admin screen. */
export const AdminHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <header className="admin-head">
    <p className="admin-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
  </header>
);
