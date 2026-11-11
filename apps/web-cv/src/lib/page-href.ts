/**
 * Public URL of a CMS page. The `home` page is the developer space; `/` itself
 * is the landing page that splits the site into its developer and notes sides.
 */
export const DEVELOPER_PATH = '/developer';

export const pageHref = (slug: string): string => (slug === 'home' ? DEVELOPER_PATH : `/${slug}`);
