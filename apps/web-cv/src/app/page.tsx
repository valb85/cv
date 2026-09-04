import type { Metadata } from 'next';

import { pageMetadata, renderSlug } from '@/lib/render-page';

export const dynamic = 'force-dynamic';

export const generateMetadata = (): Metadata => pageMetadata('home');

export default function HomePage() {
  return renderSlug('home');
}
