/**
 * The downloadable CV as structured data: what Admin -> CV edits and what
 * /cv-print lays out. Kept apart from the site's page blocks, because a CV
 * wants different things - company names, phone, bullet points - than the
 * marketing pages do.
 *
 * Pure types and parsing only; reading and saving live in src/lib/cv.ts.
 */

export type CvExperience = {
  role: string;
  company: string;
  location: string;
  period: string;
  /** Free text. Lines starting with "- " are printed as bullet points. */
  description: string;
  tech: string[];
};

export type CvEducation = {
  degree: string;
  school: string;
  period: string;
  description: string;
};

export type CvSkillGroup = { group: string; items: string[] };

export type CvLanguage = { name: string; level: string };

export type CvProject = {
  name: string;
  description: string;
  tech: string[];
  link: string;
};

export type CvDocument = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  experience: CvExperience[];
  education: CvEducation[];
  skills: CvSkillGroup[];
  languages: CvLanguage[];
  projects: CvProject[];
  interests: string[];
};

export const EMPTY_CV: CvDocument = {
  name: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  interests: [],
};

/** Comma-separated free text -> trimmed, non-empty parts. */
export const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const text = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();

/** Normalises line endings and strips trailing blanks from multi-line fields. */
const multiline = (data: FormData, key: string): string =>
  text(data, key).replace(/\r\n?/g, '\n');

/**
 * Repeating sections post as parallel arrays (expRole[], expCompany[], ...),
 * the same convention as the block editor. A row whose key field is blank is
 * dropped - that is how a row is removed.
 */
const rows = (data: FormData, key: string): string[] =>
  data.getAll(key).map((value) => String(value).trim().replace(/\r\n?/g, '\n'));

export const parseCvForm = (data: FormData): CvDocument => {
  const exp = {
    role: rows(data, 'expRole'),
    company: rows(data, 'expCompany'),
    location: rows(data, 'expLocation'),
    period: rows(data, 'expPeriod'),
    description: rows(data, 'expDescription'),
    tech: rows(data, 'expTech'),
  };
  const edu = {
    degree: rows(data, 'eduDegree'),
    school: rows(data, 'eduSchool'),
    period: rows(data, 'eduPeriod'),
    description: rows(data, 'eduDescription'),
  };
  const skill = { group: rows(data, 'skillGroup'), items: rows(data, 'skillItems') };
  const lang = { name: rows(data, 'langName'), level: rows(data, 'langLevel') };
  const proj = {
    name: rows(data, 'projName'),
    description: rows(data, 'projDescription'),
    tech: rows(data, 'projTech'),
    link: rows(data, 'projLink'),
  };

  return {
    name: text(data, 'name'),
    headline: text(data, 'headline'),
    email: text(data, 'email'),
    phone: text(data, 'phone'),
    location: text(data, 'location'),
    website: text(data, 'website'),
    linkedin: text(data, 'linkedin'),
    github: text(data, 'github'),
    summary: multiline(data, 'summary'),
    experience: exp.role
      .map((role, i) => ({
        role,
        company: exp.company[i] ?? '',
        location: exp.location[i] ?? '',
        period: exp.period[i] ?? '',
        description: exp.description[i] ?? '',
        tech: splitList(exp.tech[i] ?? ''),
      }))
      .filter((entry) => entry.role.length > 0),
    education: edu.degree
      .map((degree, i) => ({
        degree,
        school: edu.school[i] ?? '',
        period: edu.period[i] ?? '',
        description: edu.description[i] ?? '',
      }))
      .filter((entry) => entry.degree.length > 0),
    skills: skill.group
      .map((group, i) => ({ group, items: splitList(skill.items[i] ?? '') }))
      .filter((entry) => entry.group.length > 0),
    languages: lang.name
      .map((name, i) => ({ name, level: lang.level[i] ?? '' }))
      .filter((entry) => entry.name.length > 0),
    projects: proj.name
      .map((name, i) => ({
        name,
        description: proj.description[i] ?? '',
        tech: splitList(proj.tech[i] ?? ''),
        link: proj.link[i] ?? '',
      }))
      .filter((entry) => entry.name.length > 0),
    interests: splitList(text(data, 'interests')),
  };
};

/**
 * A stored document filled out to the current shape, so a field added later
 * never reaches the renderer as undefined.
 */
export const normalizeCv = (stored: Partial<CvDocument> | null | undefined): CvDocument => ({
  ...EMPTY_CV,
  ...stored,
});
