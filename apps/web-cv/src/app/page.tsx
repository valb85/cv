import type { Metadata } from 'next';

import { pageMetadata, renderSlug } from '@/lib/render-page';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ contact?: string }> };

export const generateMetadata = (): Metadata => pageMetadata('home');

export default async function HomePage({ searchParams }: Props) {
  return renderSlug('home', (await searchParams).contact === 'sent');
}
