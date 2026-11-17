import { createHash } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { cvDocument } from '@/db/schema';
import { normalizeCv, type CvDocument } from '@/lib/cv-document';
import { getPageWithBlocks, type RenderableBlock } from '@/lib/queries';
import { getAllSettings } from '@/lib/settings';

const CV_ROW_ID = 1;

const blocksOf = (slug: string): RenderableBlock[] => getPageWithBlocks(slug)?.blocks ?? [];

const ofType = <T extends RenderableBlock['type']>(
  list: RenderableBlock[],
  type: T,
): Extract<RenderableBlock, { type: T }>[] =>
  list.filter((block): block is Extract<RenderableBlock, { type: T }> => block.type === type);

/**
 * A first draft of the CV from what the site already says, so the editor does
 * not open empty: identity from settings, the summary from About, the
 * timelines from Resume, projects from Projects. Anything the site does not
 * have (company names, phone) is left blank to fill in.
 */
export const importCvFromSite = (): CvDocument => {
  const settings = getAllSettings();
  const home = blocksOf('home');
  const about = blocksOf('about');
  const resume = blocksOf('resume');
  const projects = blocksOf('projects');

  const timelines = ofType(resume, 'timeline');
  const isEducation = (block: (typeof timelines)[number]): boolean =>
    /educa|studi|school/i.test(block.data.title) || block.data.icon === 'graduation';

  const resumePills = ofType(resume, 'pill_group');
  const skillPills = resumePills.length > 0 ? resumePills : ofType(home, 'pill_group');

  return normalizeCv({
    name: settings.site_title ?? '',
    headline: settings.role ?? '',
    email: settings.contact_email ?? '',
    location:
      ofType(home, 'info_list')
        .flatMap((block) => block.data.items)
        .find((item) => item.icon === 'mapPin')?.title ?? '',
    website: process.env.BASE_URL ?? '',
    linkedin: settings.social_linkedin ?? '',
    github: settings.social_github ?? '',
    summary: ofType(about, 'hero')[0]?.data.body ?? '',
    experience: timelines
      .filter((block) => !isEducation(block))
      .flatMap((block) => block.data.entries)
      .map((entry) => ({
        role: entry.title,
        company: '',
        location: '',
        period: entry.period,
        description: entry.description,
        tech: entry.tags,
      })),
    education: timelines
      .filter(isEducation)
      .flatMap((block) => block.data.entries)
      .map((entry) => ({
        degree: entry.title,
        // The site puts the institution in the entry's link text or its tags.
        school: entry.linkLabel || entry.tags.join(', '),
        period: entry.period,
        description: entry.description,
      })),
    skills: skillPills.map((block) => ({
      group: block.data.title ?? 'Skills',
      items: block.data.pills.map((pill) => pill.label),
    })),
    languages: ofType(about, 'skill_list')
      .filter((block) => /lang/i.test(block.data.title))
      .flatMap((block) => block.data.skills)
      .map((skill) => ({ name: skill.name, level: skill.label })),
    projects: ofType(projects, 'project_grid')
      .flatMap((block) => block.data.projects)
      .map((project) => ({
        name: project.title,
        description: project.text,
        tech: project.tags,
        link: project.linkHref && !project.linkHref.startsWith('#') ? project.linkHref : '',
      })),
    interests: ofType(about, 'pill_group').flatMap((block) => block.data.pills.map((pill) => pill.label)),
  });
};

/** True once the CV has been saved from the admin at least once. */
export const hasSavedCv = (): boolean =>
  getDb().select({ id: cvDocument.id }).from(cvDocument).where(eq(cvDocument.id, CV_ROW_ID)).get() !==
  undefined;

/** The saved CV, or a draft imported from the site until the first save. */
export const getCvDocument = (): CvDocument => {
  const row = getDb()
    .select({ data: cvDocument.data })
    .from(cvDocument)
    .where(eq(cvDocument.id, CV_ROW_ID))
    .get();

  return row ? normalizeCv(row.data) : importCvFromSite();
};

export const saveCvDocument = (data: CvDocument): void => {
  getDb()
    .insert(cvDocument)
    .values({ id: CV_ROW_ID, data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: cvDocument.id, set: { data, updatedAt: new Date() } })
    .run();
};

/**
 * Identifies one rendering of the CV: the document itself plus the build ID,
 * so both an admin save and a deploy that changes the layout re-render it.
 * Until the first save the draft is derived from the site, so site edits
 * change it too.
 */
export const cvVersion = (buildId: string): string =>
  createHash('sha256')
    .update(buildId)
    .update(JSON.stringify(getCvDocument()))
    .digest('hex')
    .slice(0, 16);
