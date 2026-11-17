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

/* ------------------------------------------------------------------------ */
/* Export / import                                                           */
/* ------------------------------------------------------------------------ */

/** Marks a file as a CV export, so an unrelated JSON file is refused. */
export const CV_EXPORT_FORMAT = 'cv-document';
export const CV_EXPORT_VERSION = 1;

export type CvExport = {
  format: typeof CV_EXPORT_FORMAT;
  version: typeof CV_EXPORT_VERSION;
  exportedAt: string;
  cv: CvDocument;
};

export const toCvExport = (cv: CvDocument): CvExport => ({
  format: CV_EXPORT_FORMAT,
  version: CV_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  cv,
});

const MAX_TEXT = 10_000;
const MAX_ITEMS = 100;

class ImportError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A string field: missing means empty, anything that is not a string is refused. */
const textAt = (record: Record<string, unknown>, key: string, where: string): string => {
  const value = record[key];

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new ImportError(`${where}.${key} must be text.`);
  }

  if (value.length > MAX_TEXT) {
    throw new ImportError(`${where}.${key} is longer than ${MAX_TEXT} characters.`);
  }

  return value.trim().replace(/\r\n?/g, '\n');
};

const listAt = (record: Record<string, unknown>, key: string, where: string): unknown[] => {
  const value = record[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ImportError(`${where}.${key} must be a list.`);
  }

  if (value.length > MAX_ITEMS) {
    throw new ImportError(`${where}.${key} has more than ${MAX_ITEMS} entries.`);
  }

  return value;
};

const stringsAt = (record: Record<string, unknown>, key: string, where: string): string[] =>
  listAt(record, key, where).map((item, i) => {
    if (typeof item !== 'string' || item.length > MAX_TEXT) {
      throw new ImportError(`${where}.${key}[${i}] must be text.`);
    }

    return item.trim();
  }).filter(Boolean);

const rowsAt = <T>(
  record: Record<string, unknown>,
  key: string,
  read: (row: Record<string, unknown>, where: string) => T,
): T[] =>
  listAt(record, key, 'cv').map((row, i) => {
    const where = `cv.${key}[${i}]`;

    if (!isObject(row)) {
      throw new ImportError(`${where} must be an object.`);
    }

    return read(row, where);
  });

/**
 * Reads an uploaded export back into a CvDocument. Every field is checked and
 * rebuilt from scratch, so unknown keys are dropped and a hand-edited file
 * cannot smuggle a wrong shape into the database. Rows without their key field
 * are dropped, the same rule the editor applies.
 *
 * Returns the document, or a message saying what is wrong with the file.
 */
export const parseCvExport = (raw: unknown): CvDocument | string => {
  try {
    if (!isObject(raw) || raw.format !== CV_EXPORT_FORMAT) {
      throw new ImportError('This is not a CV export file.');
    }

    if (raw.version !== CV_EXPORT_VERSION) {
      throw new ImportError(`Unsupported export version ${JSON.stringify(raw.version)}.`);
    }

    const cv = raw.cv;

    if (!isObject(cv)) {
      throw new ImportError('The file has no CV in it.');
    }

    const doc: CvDocument = {
      name: textAt(cv, 'name', 'cv'),
      headline: textAt(cv, 'headline', 'cv'),
      email: textAt(cv, 'email', 'cv'),
      phone: textAt(cv, 'phone', 'cv'),
      location: textAt(cv, 'location', 'cv'),
      website: textAt(cv, 'website', 'cv'),
      linkedin: textAt(cv, 'linkedin', 'cv'),
      github: textAt(cv, 'github', 'cv'),
      summary: textAt(cv, 'summary', 'cv'),
      experience: rowsAt(cv, 'experience', (row, where) => ({
        role: textAt(row, 'role', where),
        company: textAt(row, 'company', where),
        location: textAt(row, 'location', where),
        period: textAt(row, 'period', where),
        description: textAt(row, 'description', where),
        tech: stringsAt(row, 'tech', where),
      })).filter((entry) => entry.role),
      education: rowsAt(cv, 'education', (row, where) => ({
        degree: textAt(row, 'degree', where),
        school: textAt(row, 'school', where),
        period: textAt(row, 'period', where),
        description: textAt(row, 'description', where),
      })).filter((entry) => entry.degree),
      skills: rowsAt(cv, 'skills', (row, where) => ({
        group: textAt(row, 'group', where),
        items: stringsAt(row, 'items', where),
      })).filter((entry) => entry.group),
      languages: rowsAt(cv, 'languages', (row, where) => ({
        name: textAt(row, 'name', where),
        level: textAt(row, 'level', where),
      })).filter((entry) => entry.name),
      projects: rowsAt(cv, 'projects', (row, where) => ({
        name: textAt(row, 'name', where),
        description: textAt(row, 'description', where),
        tech: stringsAt(row, 'tech', where),
        link: textAt(row, 'link', where),
      })).filter((entry) => entry.name),
      interests: stringsAt(cv, 'interests', 'cv'),
    };

    if (!doc.name) {
      throw new ImportError('The CV in the file has no name.');
    }

    return doc;
  } catch (error) {
    if (error instanceof ImportError) {
      return error.message;
    }

    throw error;
  }
};
