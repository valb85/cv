import type { Metadata } from 'next';

import { pageMetadata, renderSlug } from '@/lib/render-page';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export const generateMetadata = async ({ params }: Params): Promise<Metadata> =>
  pageMetadata((await params).slug);

export default async function SlugPage({ params }: Params) {
  return renderSlug((await params).slug);
}
