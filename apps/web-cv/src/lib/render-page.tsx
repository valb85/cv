import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmptySite } from '@/components/EmptySite';
import { PageView } from '@/components/PageView';
import { countPublishedPages, getNavEntries, getPageWithBlocks } from '@/lib/queries';
import { getSetting } from '@/lib/settings';
import { buildTokens } from '@/lib/tokens';

export const pageMetadata = (slug: string): Metadata => {
  const content = getPageWithBlocks(slug);

  if (!content) {
    return {};
  }

  return {
    title: content.page.title,
    description: content.page.metaDescription ?? undefined,
  };
};

export const renderSlug = (slug: string, contactSent = false) => {
  const content = getPageWithBlocks(slug);

  if (!content) {
    // A fresh deployment has no content at all; a 404 on the front page would
    // read as a broken install rather than an empty one.
    if (slug === 'home' && countPublishedPages() === 0) {
      return <EmptySite />;
    }

    notFound();
  }

  return (
    <PageView
      content={content}
      nav={getNavEntries()}
      tokens={buildTokens()}
      siteTitle={getSetting('site_title') ?? content.page.title}
      contactSent={contactSent}
    />
  );
};
