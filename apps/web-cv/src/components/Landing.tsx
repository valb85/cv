import {
  ArrowRight,
  Code2,
  Feather,
  FileText,
  Laptop,
  MessageCircleMore,
  PawPrint,
  Plane,
  Sprout,
  User,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { DEVELOPER_PATH } from '@/lib/page-href';

import '@/app/landing.css';

const DEV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/projects', label: 'Projects', icon: Laptop },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/about', label: 'About', icon: User },
];

const INTERESTS: { label: string; icon: LucideIcon }[] = [
  { label: 'Code', icon: Code2 },
  { label: 'Writing', icon: Feather },
  { label: 'Pets', icon: PawPrint },
  { label: 'Travel', icon: Plane },
  { label: 'Deep Talks', icon: MessageCircleMore },
  { label: 'Life', icon: Sprout },
];

/**
 * The front door, from design/dual_2.png: the developer on the night side,
 * the writer on the lamp-lit side, the pets asleep across the seam. The art is
 * the mockup with its lettering painted out, so every word here is real text.
 */
export const Landing = ({ name, hasNotes }: { name: string; hasNotes: boolean }) => (
  <div className="landing">
    <div className="landing-stage">
      <Image
        className="landing-art"
        src="/images/landing.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
      />

      <header className="landing-head">
        <p className="landing-name">{name}</p>
        <p className="landing-tagline">Code. Thoughts. Pets. Repeat.</p>
      </header>

      <main className="landing-sides">
        <section className="side side-dev" aria-labelledby="side-dev-title">
          <p className="side-kicker">
            <Code2 size={30} strokeWidth={1.5} aria-hidden="true" />
            The
          </p>
          <h1 id="side-dev-title" className="side-title">
            Developer
          </h1>
          <span className="side-rule" aria-hidden="true" />
          <p className="side-lede">
            I build, solve and turn ideas
            <br />
            into working applications.
          </p>
          <Link className="side-cta" href={DEVELOPER_PATH}>
            Enter Developer Space
            <ArrowRight size={22} strokeWidth={1.5} aria-hidden="true" />
          </Link>
          <nav className="side-links" aria-label="Developer space">
            {DEV_LINKS.map(({ href, label, icon: LinkIcon }) => (
              <Link key={href} href={href}>
                <LinkIcon size={20} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </section>

        <p className="landing-motto">
          Two sides.
          <br />
          One person.
        </p>

        <section className="side side-notes" aria-labelledby="side-notes-title">
          <p className="side-kicker">
            <Feather size={30} strokeWidth={1.5} aria-hidden="true" />
            The
          </p>
          <h2 id="side-notes-title" className="side-title">
            Notes
          </h2>
          <p className="side-lede-script">I just like to write…</p>
          <p className="side-lede">
            Small essays, thoughts, ideas
            <br />
            and the occasional nonsense.
          </p>
          {hasNotes ? (
            <Link className="side-cta" href="/notes">
              Enter My Notes
              <ArrowRight size={22} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          ) : (
            <span className="side-cta is-soon" aria-disabled="true">
              Notes coming soon
            </span>
          )}
        </section>
      </main>

      <ul className="landing-interests" aria-label="What I care about">
        {INTERESTS.map(({ label, icon: InterestIcon }) => (
          <li key={label}>
            <InterestIcon size={30} strokeWidth={1.4} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
