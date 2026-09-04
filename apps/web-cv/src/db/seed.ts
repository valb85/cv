/**
 * Transcribes the content of the original legacy/index.html into pages and
 * blocks. Run once on an empty database; pass --force to replace existing
 * pages, which discards anything edited through the admin.
 */
import { getDb } from './client.ts';
import { blocks, pages, settings } from './schema.ts';
import type { BlockDataMap } from '../lib/blocks.ts';

type SeedBlock = {
  [K in keyof BlockDataMap]: { type: K; data: BlockDataMap[K] };
}[keyof BlockDataMap];

type SeedPage = {
  slug: string;
  title: string;
  navLabel: string;
  navOrder: number;
  metaDescription?: string;
  blocks: SeedBlock[];
};

const SETTINGS: Record<string, string> = {
  site_title: 'Victor Albulescu',
  tagline: 'Web developer in Timisoara, Romania. Back end, ERP systems, and the occasional cat photo.',
  avatar: '/images/me.jpg',
  birth_date: '1985-08-04',
  contact_email: 'albulescu.victor.alexandru@gmail.com',
  social_facebook: 'https://www.facebook.com/albulescu.victor.alexandru',
  social_linkedin: 'https://www.linkedin.com/in/victor-alexandru-albulescu-153a7155/',
  social_github: '',
};

const SEED_PAGES: SeedPage[] = [
  {
    slug: 'home',
    title: 'Victor Albulescu',
    navLabel: 'home',
    navOrder: 0,
    metaDescription: 'Victor Albulescu, web developer based in Timisoara, Romania.',
    blocks: [
      { type: 'heading', data: { text: 'I am Victor Albulescu, a web developer', level: 2 } },
      {
        type: 'fact_list',
        data: {
          facts: [
            { label: 'Age', value: '{{age}} years' },
            { label: 'Date of birth', value: '04-08-1985' },
            { label: 'Address', value: 'Timisoara, Romania' },
            { label: 'E-mail', value: 'albulescu.victor.alexandru@gmail.com' },
          ],
        },
      },
    ],
  },
  {
    slug: 'about',
    title: 'About me',
    navLabel: 'about me',
    navOrder: 1,
    blocks: [
      {
        type: 'image',
        data: { src: '/images/cat_programmer.jpeg', alt: 'A cat at a keyboard' },
      },
      {
        type: 'rich_text',
        data: {
          html:
            "<p>I'm {{age}} years old creative web developer based in Timisoara, specialized in " +
            'back end development for web applications. I worked a long period also as a full ' +
            'stack developer.</p>' +
            '<p>I love animals especially cats, to read, to travel and to talk. Yeah, I am a ' +
            'talker and a chatty person.</p>',
        },
      },
      {
        type: 'skill_list',
        data: {
          title: 'My Skills',
          skills: [
            { name: 'PHP', level: 4, label: 'Advanced' },
            { name: 'HTML', level: 3, label: 'Intermediate' },
            { name: 'CSS & CSS3', level: 3, label: 'Intermediate' },
            { name: 'javascript & jQuery', level: 3, label: 'Intermediate' },
          ],
        },
      },
      {
        type: 'skill_list',
        data: {
          title: 'Languages',
          skills: [
            { name: 'Romanian', level: 5, label: 'native' },
            { name: 'English', level: 4, label: 'intermediate' },
            { name: 'French', level: 2, label: 'Beginner' },
          ],
        },
      },
    ],
  },
  {
    slug: 'resume',
    title: 'Resume',
    navLabel: 'my résumé',
    navOrder: 2,
    blocks: [
      {
        type: 'timeline',
        data: {
          title: 'Education',
          entries: [
            {
              period: '2012 - 2014',
              title: 'Master Degree',
              description:
                '"Models and methods in artificial intelligence", on "Facultatea de Stiinte ' +
                'Exacte", Craiova.',
            },
            {
              period: '2007 - 2011',
              title: 'Bachelor Degree',
              description:
                'Bachelor Degree in Informatics, on "Facultatea de Matematica si Informatica", ' +
                'Craiova.',
            },
          ],
        },
      },
      {
        type: 'timeline',
        data: {
          title: 'Experience',
          entries: [
            {
              period: '2014 - Present',
              title: 'Web Developer',
              description:
                'Working with several frameworks like Magento, Cake PHP, Sails js, Sugar CRM, ' +
                'Symphony, Laravel to create diverse apps and web solutions. In last 3 years I ' +
                'worked mostly to customize, maintain and develop ERP solutions.',
            },
            {
              period: '2011 - 2013',
              title: 'Junior Web Developer',
              description:
                'Started to work as full stack developer, creating websites and web solution ' +
                'using php, css and javascript.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Me',
    navLabel: 'contact',
    navOrder: 3,
    blocks: [
      {
        type: 'rich_text',
        data: {
          html:
            '<p>If you want to talk with me or need more information, please use details from ' +
            'below or the contact form.</p>',
        },
      },
      {
        type: 'fact_list',
        data: {
          title: 'Get in Touch',
          facts: [
            { label: 'Find Me', value: 'Timisoara, Romania' },
            { label: 'Mail Me', value: 'albulescu.victor.alexandru@gmail.com' },
          ],
        },
      },
      { type: 'contact_form', data: { intro: 'Or send a message directly:' } },
    ],
  },
];

const seed = (force: boolean): void => {
  const db = getDb();
  const existing = db.select({ id: pages.id }).from(pages).all();

  if (existing.length > 0 && !force) {
    console.log(`[seed] ${existing.length} pages already exist; refusing. Pass --force to replace.`);
    return;
  }

  if (existing.length > 0) {
    console.log(`[seed] --force: removing ${existing.length} existing pages`);
    db.delete(pages).run();
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .run();
  }

  for (const page of SEED_PAGES) {
    const inserted = db
      .insert(pages)
      .values({
        slug: page.slug,
        title: page.title,
        navLabel: page.navLabel,
        navOrder: page.navOrder,
        inMenu: true,
        published: true,
        metaDescription: page.metaDescription ?? null,
      })
      .returning({ id: pages.id })
      .get();

    page.blocks.forEach((block, position) => {
      db.insert(blocks)
        .values({ pageId: inserted.id, type: block.type, position, data: block.data })
        .run();
    });
  }

  console.log(
    `[seed] ${SEED_PAGES.length} pages, ` +
      `${SEED_PAGES.reduce((n, p) => n + p.blocks.length, 0)} blocks, ` +
      `${Object.keys(SETTINGS).length} settings`,
  );
};

seed(process.argv.includes('--force'));
