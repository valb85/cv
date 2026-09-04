/**
 * Seeds the site from the design mockups in design/*.png. Run once on an empty
 * database; pass --force to replace existing pages, which discards anything
 * edited through the admin.
 */
import type { BlockDataMap } from '../lib/blocks.ts';
import { getDb } from './client.ts';
import { blocks, pages, settings } from './schema.ts';

type SeedBlock = {
  [K in keyof BlockDataMap]: { type: K; column?: number; data: BlockDataMap[K] };
}[keyof BlockDataMap];

type SeedPage = {
  slug: string;
  title: string;
  navLabel: string;
  navIcon: string;
  navOrder: number;
  columns?: number;
  metaDescription?: string;
  blocks: SeedBlock[];
};

const SETTINGS: Record<string, string> = {
  site_title: 'Victor Albulescu',
  role: 'Web Developer',
  avatar: '/images/me.jpg',
  footer_note: 'Built with ✳ and passion.',
  // Drives the {{age}} token. Deliberately not shown as a fact on the home
  // page - the age is the useful part, the date of birth is not.
  birth_date: '1985-08-04',
  contact_email: 'albulescu.victor.alexandru@gmail.com',
  social_github: '',
  social_linkedin: 'https://www.linkedin.com/in/victor-alexandru-albulescu-153a7155/',
  social_facebook: 'https://www.facebook.com/albulescu.victor.alexandru',
  social_twitter: '',
  social_instagram: '',
};

const QUOTE: BlockDataMap['quote'] = {
  text: 'First, solve the problem. Then, write the code.',
  attribution: 'John Johnson',
};

const SEED_PAGES: SeedPage[] = [
  {
    slug: 'home',
    title: 'Victor Albulescu',
    navLabel: 'Home',
    navIcon: 'home',
    navOrder: 0,
    columns: 2,
    metaDescription:
      'Victor Albulescu — full stack web developer in Timisoara, Romania, building web applications, APIs and scalable solutions.',
    blocks: [
      {
        type: 'hero',
        data: {
          eyebrow: "Hello, I'm",
          titleLead: 'Victor',
          titleAccent: 'Albulescu',
          subtitle: 'Web Developer & Problem Solver',
          body:
            "I'm a full stack web developer from Timisoara, Romania, with 14+ years of experience " +
            'building web applications, APIs and scalable solutions. I enjoy turning complex ' +
            'problems into simple, beautiful and intuitive applications.',
          primaryLabel: 'Get In Touch',
          primaryHref: '/contact',
          primaryIcon: 'mail',
          secondaryLabel: 'Download CV',
          secondaryHref: '/cv.pdf',
          secondaryIcon: 'file',
          image: '/images/hero-desk.jpg',
          script: 'Code\nTravel\nPets\nRepeat',
        },
      },
      {
        type: 'card_grid',
        data: {
          columns: 4,
          cards: [
            { icon: 'code', title: 'Clean Code', text: 'Readable, maintainable and scalable solutions' },
            { icon: 'rocket', title: 'Problem Solver', text: 'Turning ideas into real applications' },
            { icon: 'users', title: 'Team Player', text: 'Experience in agile and remote teams' },
            { icon: 'coffee', title: 'Always Learning', text: 'New technologies, better solutions' },
          ],
        },
      },
      {
        type: 'pill_group',
        column: 1,
        data: {
          title: 'Featured Skills',
          linkLabel: 'View all skills',
          linkHref: '/resume',
          pills: [
            'PHP', 'Laravel', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Ionic',
            'MySQL', 'Docker', 'Azure', 'Git', 'HTML', 'CSS / SCSS', 'Linux', 'CI/CD',
            'REST APIs',
          ].map((label) => ({ label })),
        },
      },
      {
        type: 'info_list',
        column: 2,
        data: {
          boxed: false,
          items: [
            { icon: 'mapPin', title: 'Timisoara, Romania', text: 'Based in Romania, open to remote work' },
            {
              icon: 'mail',
              title: 'albulescu.victor.alexandru@gmail.com',
              text: 'Feel free to drop me a message',
            },
            { icon: 'calendar', title: '04 August 1985', text: '{{age}} years old' },
            {
              icon: 'briefcase',
              title: 'Available for freelance',
              text: "Let's build something great together",
            },
          ],
        },
      },
      { type: 'quote', column: 1, data: QUOTE },
    ],
  },

  {
    slug: 'about',
    title: 'About Me',
    navLabel: 'About',
    navIcon: 'user',
    navOrder: 1,
    metaDescription: 'Senior full-stack web developer from Timisoara with 14+ years of experience.',
    blocks: [
      {
        type: 'hero',
        data: {
          eyebrow: 'Get to know me',
          titleLead: 'About',
          titleAccent: 'Me',
          body:
            "I'm Victor Albulescu, a senior full-stack web developer from Timisoara, Romania with " +
            '14+ years of experience building web applications, APIs, integrations and scalable ' +
            'business solutions.\n\nI enjoy turning complex problems into simple, elegant ' +
            "solutions. When I'm not coding, you'll find me traveling, reading, taking photos or " +
            'spending quality time with my pets.',
          image: '/images/hero-desk.jpg',
          script: 'Code\nTravel\nPets\nRepeat',
        },
      },
      {
        type: 'card_grid',
        data: {
          columns: 4,
          cards: [
            { icon: 'calendar', stat: '14+', title: 'Years Experience', text: 'Building web solutions since 2011' },
            { icon: 'code', title: 'Full Stack', text: 'Backend, frontend & everything in between' },
            { icon: 'globe', title: 'Remote Friendly', text: 'Experienced in remote teams & async culture' },
            { icon: 'puzzle', title: 'Problem Solver', text: 'Love solving problems with clean code' },
          ],
        },
      },
      {
        type: 'card_grid',
        data: {
          title: 'What I Do',
          columns: 4,
          cards: [
            {
              icon: 'server',
              title: 'Backend Development',
              text: 'Robust PHP applications, RESTful APIs, database design & performance optimization.',
            },
            {
              icon: 'devices',
              title: 'Frontend & Mobile',
              text: 'Modern, responsive UI with clean code, great UX and performance in mind.',
            },
            {
              icon: 'link',
              title: 'API / Integrations',
              text: 'Third-party integrations, payment gateways, CRM/ERP connections & automation.',
            },
            {
              icon: 'cloud',
              title: 'Cloud / DevOps',
              text: 'Deployment, CI/CD, infrastructure, monitoring and scalable cloud architectures.',
            },
          ],
        },
      },
      {
        type: 'skill_list',
        data: {
          title: 'Languages',
          skills: [
            { name: 'Romanian', level: 5, label: 'Native' },
            { name: 'English', level: 4, label: 'Advanced' },
          ],
        },
      },
      {
        type: 'pill_group',
        data: {
          title: 'Beyond Code',
          pills: [
            { label: 'Travel', icon: 'plane' },
            { label: 'Pets', icon: 'paw' },
            { label: 'Photography', icon: 'camera' },
            { label: 'Problem Solving', icon: 'lightbulb' },
          ],
        },
      },
    ],
  },

  {
    slug: 'resume',
    title: 'Resume',
    navLabel: 'Resume',
    navIcon: 'file',
    navOrder: 2,
    columns: 2,
    metaDescription: 'Professional experience, education and technical skills.',
    blocks: [
      {
        type: 'hero',
        data: {
          titleLead: 'Resume',
          body:
            "A summary of my professional experience, education, and the skills I've developed " +
            'over the years.',
        },
      },
      {
        type: 'timeline',
        column: 1,
        data: {
          title: 'Experience',
          icon: 'briefcase',
          entries: [
            {
              period: '2014 – Present',
              title: 'Senior Web Developer / Software Engineer',
              description:
                'Building complex web applications, REST APIs, and ERP/business software. Leading ' +
                'full-cycle development, system integrations, and performance optimization. ' +
                'Modernizing legacy platforms and delivering scalable solutions.',
              tags: ['PHP', 'Laravel', 'React', 'Ionic', 'TypeScript', 'MySQL', 'Azure'],
            },
            {
              period: '2011 – 2014',
              title: 'Web Developer',
              description:
                'Developed dynamic websites and web applications using PHP, JavaScript and CSS. ' +
                'Collaborated with designers and backend developers to deliver user-friendly ' +
                'solutions and build a strong foundation in full-stack development.',
              tags: ['PHP', 'JavaScript', 'CSS', 'MySQL'],
            },
          ],
        },
      },
      {
        type: 'timeline',
        column: 2,
        data: {
          title: 'Education',
          icon: 'graduation',
          entries: [
            {
              period: '2012 – 2014',
              title: 'Master Degree',
              description:
                'Master studies in Informatics, with focus on artificial intelligence methods and models.',
              tags: [],
              linkLabel: 'Facultatea de Stiinte Exacte, Craiova',
              linkHref: '#',
            },
            {
              period: '2007 – 2011',
              title: 'Bachelor Degree',
              description:
                'Bachelor studies in Informatics, with focus on mathematics and computer science fundamentals.',
              tags: [],
              linkLabel: 'Facultatea de Matematica si Informatica, Craiova',
              linkHref: '#',
            },
          ],
        },
      },
      {
        type: 'pill_group',
        column: 1,
        data: {
          title: 'Core Stack',
          pills: [
            { label: 'PHP', icon: 'code' },
            { label: 'Laravel', icon: 'layers' },
            { label: 'React', icon: 'zap' },
            { label: 'TypeScript', icon: 'code' },
            { label: 'Ionic', icon: 'devices' },
            { label: 'MySQL', icon: 'database' },
            { label: 'Docker', icon: 'server' },
            { label: 'Azure', icon: 'cloud' },
            { label: 'REST APIs', icon: 'link' },
            { label: 'Salesforce', icon: 'cloud' },
          ],
        },
      },
      {
        type: 'card_grid',
        column: 2,
        data: {
          title: 'Working Style',
          columns: 2,
          cards: [
            { icon: 'code', title: 'Clean Code', text: 'I write readable, maintainable and scalable code.' },
            { icon: 'rocket', title: 'Problem Solver', text: 'I enjoy turning complex problems into simple solutions.' },
            { icon: 'users', title: 'Team Player', text: 'I collaborate effectively and value communication.' },
            { icon: 'graduation', title: 'Always Learning', text: 'I stay curious and adopt new technologies.' },
          ],
        },
      },
      { type: 'quote', data: QUOTE },
    ],
  },

  {
    slug: 'projects',
    title: 'Projects',
    navLabel: 'Projects',
    navIcon: 'grid',
    navOrder: 3,
    metaDescription: 'Selected work and products I helped build.',
    blocks: [
      {
        type: 'hero',
        data: {
          eyebrow: 'My work',
          titleLead: 'Projects',
          body: 'Selected work and products I helped build.',
        },
      },
      {
        type: 'project_grid',
        data: {
          columns: 4,
          projects: [
            {
              image: '/images/project-erp.jpg',
              title: 'Enterprise ERP Platform',
              text: 'Scalable ERP system for managing business workflows, dashboards and integrations.',
              tags: ['Laravel', 'MySQL', 'Vue.js', 'Docker'],
              linkLabel: 'View Project',
              linkHref: '#',
            },
            {
              image: '/images/project-mobile.jpg',
              title: 'Mobile Transfer App',
              text: 'Cross-platform operational app built for field teams to transfer and track data in real time.',
              tags: ['Flutter', 'Dart', 'Firebase', 'REST API'],
              linkLabel: 'View Project',
              linkHref: '#',
            },
            {
              image: '/images/project-sap.jpg',
              title: 'SAP / Azure Integrations',
              text: 'APIs, automation and cloud migration solutions connecting SAP with Microsoft Azure.',
              tags: ['PHP', 'SAP API', 'Azure', 'REST API'],
              linkLabel: 'View Project',
              linkHref: '#',
            },
            {
              image: '/images/project-ampatit.jpg',
              title: 'ampatit.ro',
              text: 'Anonymous Romanian social/feed platform concept with humor and clean user experience.',
              tags: ['Next.js', 'Tailwind CSS', 'Prisma', 'PostgreSQL'],
              linkLabel: 'View Project',
              linkHref: '#',
            },
          ],
        },
      },
      {
        type: 'card_grid',
        data: {
          title: 'What I Build',
          columns: 5,
          cards: [
            { icon: 'devices', title: 'Web Applications', text: 'Full stack web apps with modern stacks' },
            { icon: 'code', title: 'REST APIs', text: 'Secure, well-structured and documented APIs' },
            { icon: 'grid', title: 'Dashboards', text: 'Real-time dashboards and data visualization' },
            { icon: 'puzzle', title: 'Integrations', text: 'Third-party integrations and cloud solutions' },
            { icon: 'sparkles', title: 'Modern UI', text: 'Clean, responsive and accessible interfaces' },
          ],
        },
      },
    ],
  },

  {
    slug: 'contact',
    title: 'Contact',
    navLabel: 'Contact',
    navIcon: 'mail',
    navOrder: 4,
    columns: 3,
    metaDescription: 'Get in touch about projects, opportunities and collaborations.',
    blocks: [
      {
        type: 'hero',
        data: {
          eyebrow: "Let's connect",
          titleLead: 'Contact',
          subtitle: "Let's build something great together",
          body:
            "I'm always open to new opportunities, exciting projects and meaningful " +
            "collaborations. Drop me a message and I'll get back to you as soon as possible.",
        },
      },
      {
        type: 'info_list',
        column: 1,
        data: {
          boxed: true,
          items: [
            { icon: 'mapPin', title: 'Location', text: 'Timisoara, Romania' },
            { icon: 'mail', title: 'E-mail', text: 'albulescu.victor.alexandru@gmail.com' },
            { icon: 'briefcase', title: 'Availability', text: 'Open to freelance and remote collaborations' },
          ],
        },
      },
      {
        type: 'quote',
        column: 1,
        data: { text: "Great ideas start with a conversation. I'm excited to hear yours." },
      },
      {
        type: 'contact_form',
        column: 2,
        data: {
          title: 'Send me a message',
          subjects: ['New project', 'Job opportunity', 'Collaboration', 'Something else'],
          footnote: 'Your information is safe and will never be shared.',
        },
      },
      {
        type: 'image',
        column: 3,
        data: { src: '/images/contact-side.jpg', alt: 'Desk with a cat and a dog' },
      },
      {
        type: 'rich_text',
        column: 3,
        data: {
          html:
            '<h3>Code. Travel. Pets. Repeat.</h3>' +
            "<p>When I'm not coding, you'll find me traveling, reading or spending time with my " +
            'cat and dog. They keep me inspired every day.</p>',
        },
      },
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
        navIcon: page.navIcon,
        navOrder: page.navOrder,
        columns: page.columns ?? 1,
        inMenu: true,
        published: true,
        metaDescription: page.metaDescription ?? null,
      })
      .returning({ id: pages.id })
      .get();

    page.blocks.forEach((block, position) => {
      db.insert(blocks)
        .values({
          pageId: inserted.id,
          type: block.type,
          position,
          column: block.column ?? 0,
          data: block.data,
        })
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
