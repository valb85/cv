import type { Metadata } from 'next';

import { pageMetadata, renderSlug } from '@/lib/render-page';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ contact?: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> =>
  pageMetadata((await params).slug);

export default async function SlugPage({ params, searchParams }: Props) {
  return renderSlug((await params).slug, (await searchParams).contact === 'sent');
}
