import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_AXIOS_BRAND_PROFILE_PATH = 'private/knowledge/axios-brand-profile.json';
export const PUBLIC_AXIOS_BRAND_PROFILE_EXAMPLE_PATH = 'knowledge/axios-brand-profile.example.json';

export interface AxiosBrandKnowledgeOptions {
  readonly repositoryRoot?: string;
  readonly profilePath?: string;
}

export interface AxiosBrandProfileReadOptions extends AxiosBrandKnowledgeOptions {
  readonly includePageText?: boolean;
  readonly maxSections?: number;
  readonly query?: string;
}

export interface AxiosBrandProfileSection {
  readonly page: number;
  readonly heading: string;
  readonly text: string;
  readonly wordCount: number;
}

export interface AxiosBrandProfile {
  readonly profileVersion: string;
  readonly generatedAt: string;
  readonly source: {
    readonly fileName: string;
    readonly sha256: string;
    readonly pages: number;
  };
  readonly usage: {
    readonly visibility: string;
    readonly commitPolicy: string;
  };
  readonly sections: readonly AxiosBrandProfileSection[];
}

export interface AxiosBrandKnowledgeStatus {
  readonly success: true;
  readonly repositoryRoot: string;
  readonly defaultProfilePath: string;
  readonly resolvedProfilePath: string;
  readonly privateProfileExists: boolean;
  readonly publicExamplePath: string;
  readonly publicExampleExists: boolean;
  readonly guidance: readonly string[];
}

export interface AxiosBrandProfileReadSuccess {
  readonly success: true;
  readonly profilePath: string;
  readonly source: AxiosBrandProfile['source'];
  readonly usage: AxiosBrandProfile['usage'];
  readonly totalSections: number;
  readonly returnedSections: number;
  readonly sections: readonly (Omit<AxiosBrandProfileSection, 'text'> | AxiosBrandProfileSection)[];
}

export interface AxiosBrandProfileReadError {
  readonly success: false;
  readonly error: string;
  readonly profilePath: string;
  readonly guidance: readonly string[];
}

export type AxiosBrandProfileReadResult = AxiosBrandProfileReadSuccess | AxiosBrandProfileReadError;

export function getAxiosBrandKnowledgeStatus(options: AxiosBrandKnowledgeOptions = {}): AxiosBrandKnowledgeStatus {
  const repositoryRoot = resolveRepositoryRoot(options.repositoryRoot);
  const profilePath = options.profilePath ?? DEFAULT_AXIOS_BRAND_PROFILE_PATH;
  const resolvedProfilePath = resolveInsideRepository(repositoryRoot, profilePath);
  const publicExamplePath = path.resolve(repositoryRoot, PUBLIC_AXIOS_BRAND_PROFILE_EXAMPLE_PATH);

  return {
    success: true,
    repositoryRoot,
    defaultProfilePath: DEFAULT_AXIOS_BRAND_PROFILE_PATH,
    resolvedProfilePath,
    privateProfileExists: existsSync(resolvedProfilePath),
    publicExamplePath: PUBLIC_AXIOS_BRAND_PROFILE_EXAMPLE_PATH,
    publicExampleExists: existsSync(publicExamplePath),
    guidance: [
      'Do not commit raw Axios brand PDFs or generated proprietary profiles while the repository is public; keep them under private/.',
      'Use scripts/import-axios-brand-guidelines.py to regenerate the private brand profile from an approved PDF.',
      'Only commit private/knowledge/axios-brand-profile.json after the repository is private or moved under approved Axios access controls.'
    ]
  };
}

export function readAxiosBrandProfile(options: AxiosBrandProfileReadOptions = {}): AxiosBrandProfileReadResult {
  const repositoryRoot = resolveRepositoryRoot(options.repositoryRoot);
  const profilePath = options.profilePath ?? DEFAULT_AXIOS_BRAND_PROFILE_PATH;
  const resolvedProfilePath = resolveInsideRepository(repositoryRoot, profilePath);
  const guidance = getAxiosBrandKnowledgeStatus({ repositoryRoot, profilePath }).guidance;

  if (!isInsideRepository(repositoryRoot, resolvedProfilePath)) {
    return {
      success: false,
      error: 'Brand profile path must stay inside the repository.',
      profilePath: resolvedProfilePath,
      guidance
    };
  }

  if (!existsSync(resolvedProfilePath)) {
    return {
      success: false,
      error: `Brand profile was not found at ${profilePath}.`,
      profilePath: resolvedProfilePath,
      guidance
    };
  }

  const profile = JSON.parse(readFileSync(resolvedProfilePath, 'utf8')) as AxiosBrandProfile;
  const includePageText = options.includePageText === true;
  const maxSections = clampMaxSections(options.maxSections);
  const terms = tokenizeQuery(options.query);
  const filteredSections = profile.sections.filter((section) => {
    if (terms.length === 0) {
      return true;
    }
    const haystack = `${section.heading}\n${section.text}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
  const returnedSections = filteredSections.slice(0, maxSections).map((section) => {
    const base = {
      page: section.page,
      heading: section.heading,
      wordCount: section.wordCount
    };
    return includePageText ? { ...base, text: section.text } : base;
  });

  return {
    success: true,
    profilePath: resolvedProfilePath,
    source: profile.source,
    usage: profile.usage,
    totalSections: filteredSections.length,
    returnedSections: returnedSections.length,
    sections: returnedSections
  };
}

function resolveRepositoryRoot(repositoryRoot: string | undefined): string {
  return path.resolve(repositoryRoot ?? process.cwd());
}

function resolveInsideRepository(repositoryRoot: string, candidatePath: string): string {
  if (path.isAbsolute(candidatePath)) {
    return path.resolve(candidatePath);
  }

  return path.resolve(repositoryRoot, candidatePath);
}

function isInsideRepository(repositoryRoot: string, candidatePath: string): boolean {
  const relative = path.relative(repositoryRoot, candidatePath);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function clampMaxSections(maxSections: number | undefined): number {
  if (maxSections === undefined || !Number.isFinite(maxSections)) {
    return 12;
  }

  return Math.min(50, Math.max(1, Math.floor(maxSections)));
}

function tokenizeQuery(query: string | undefined): string[] {
  if (query === undefined || query.trim().length === 0) {
    return [];
  }

  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9-]+/g, ''))
    .filter((term) => term.length > 0);
}
