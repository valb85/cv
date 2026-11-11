import type { Metadata } from 'next';

import { Landing } from '@/components/Landing';
import { getPageWithBlocks } from '@/lib/queries';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const generateMetadata = (): Metadata => ({
  title: getAllSettings().site_title || 'Victor Albulescu',
});

export default function HomePage() {
  // The notes side has no section of its own yet; its button stays inert
  // until a published `notes` page exists, rather than leading to a 404.
  const hasNotes = getPageWithBlocks('notes') !== null;

  return <Landing name={getAllSettings().site_title || 'Victor Albulescu'} hasNotes={hasNotes} />;
}
