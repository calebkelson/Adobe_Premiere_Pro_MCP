import { AXIOS_EDITOR_SKILL_CATEGORIES, type AxiosEditorSkillCategory } from './editorSkills.js';

export interface AxiosCustomSkillPlanOptions {
  readonly request: string;
  readonly name?: string;
  readonly examples?: readonly string[];
  readonly category?: AxiosEditorSkillCategory;
  readonly requestCount?: number;
  readonly desiredOutcome?: string;
  readonly needsBrandProfile?: boolean;
}

export interface AxiosCustomSkillPlan {
  readonly success: true;
  readonly draft: {
    readonly id: string;
    readonly name: string;
    readonly category: AxiosEditorSkillCategory;
    readonly description: string;
    readonly triggerPhrases: readonly string[];
    readonly evidenceToReview: readonly string[];
    readonly primaryOutputs: readonly string[];
    readonly recommendedPremiereTools: readonly string[];
    readonly requiresBrandProfile: boolean;
  };
  readonly promotion: {
    readonly requestCount: number;
    readonly score: number;
    readonly recommendation: string;
    readonly checklist: readonly string[];
  };
  readonly organization: {
    readonly catalogPath: string;
    readonly implementationPath: string;
    readonly testPath: string;
    readonly privateRequestLogPath: string;
  };
}

export interface AxiosCustomSkillPlanError {
  readonly success: false;
  readonly error: string;
}

export type AxiosCustomSkillPlanResult = AxiosCustomSkillPlan | AxiosCustomSkillPlanError;

export function planAxiosCustomEditorSkill(options: AxiosCustomSkillPlanOptions): AxiosCustomSkillPlanResult {
  const request = options.request.trim();
  if (request.length === 0) {
    return {
      success: false,
      error: 'A custom skill request is required.'
    };
  }

  const name = options.name?.trim() || buildSkillName(request);
  const id = normalizeSkillId(name);
  const examples = normalizeExamples(options.examples, request);
  const category = options.category ?? inferCategory(request);
  const requestCount = Math.max(options.requestCount ?? examples.length, 1);
  const requiresBrandProfile = options.needsBrandProfile ?? category === 'brand';
  const score = buildPromotionScore(requestCount, examples.length, Boolean(options.desiredOutcome));

  return {
    success: true,
    draft: {
      id,
      name,
      category,
      description: buildDescription(name, request),
      triggerPhrases: examples,
      evidenceToReview: inferEvidence(category),
      primaryOutputs: inferOutputs(category, options.desiredOutcome),
      recommendedPremiereTools: inferPremiereTools(category),
      requiresBrandProfile
    },
    promotion: {
      requestCount,
      score,
      recommendation: score >= 70 ? 'Promote this into the Axios skill catalog.' : 'Keep collecting examples before promoting this into the catalog.',
      checklist: [
        'Capture at least three real editor requests that would trigger this skill.',
        'Define the exact output shape editors expect.',
        'Decide whether the skill is review-only, marker-generating, or allowed to modify a sequence after approval.',
        'Add tests for the planner before adding destructive Premiere operations.',
        'Document any private brand or source-material dependency.'
      ]
    },
    organization: {
      catalogPath: 'docs/AXIOS_EDITOR_SKILLS.md',
      implementationPath: `src/axios/skills/${id}.ts`,
      testPath: `src/__tests__/axios/skills/${id}.test.ts`,
      privateRequestLogPath: `private/skill-requests/${id}.json`
    }
  };
}

function buildSkillName(request: string): string {
  const words = request
    .replace(/[^a-zA-Z0-9\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 5);

  if (words.length === 0) {
    return 'Custom Editor Skill';
  }

  return words.map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function normalizeSkillId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'custom_editor_skill';
}

function normalizeExamples(examples: readonly string[] | undefined, request: string): string[] {
  const normalized = (examples ?? [])
    .map((example) => example.trim())
    .filter((example) => example.length > 0);

  return normalized.length > 0 ? normalized : [request];
}

function inferCategory(request: string): AxiosEditorSkillCategory {
  const text = request.toLowerCase();
  const categoryMatchers: readonly [AxiosEditorSkillCategory, readonly string[]][] = [
    ['brand', ['brand', 'font', 'color', 'logo', 'lower third']],
    ['social', ['social', 'shorts', 'tiktok', 'instagram', 'linkedin', 'youtube', 'clip']],
    ['visuals', ['b-roll', 'b roll', 'graphic', 'chart', 'frame', 'visual']],
    ['fact_checking', ['fact', 'claim', 'source', 'verify']],
    ['quality', ['qc', 'quality', 'silence', 'audio', 'caption']],
    ['export', ['export', 'preset', 'deliverable', 'aspect ratio']],
    ['brevity', ['shorter', 'cut', 'rewrite', 'brevity', 'filler']],
    ['story', ['story', 'opening', 'opener', 'beginning', 'structure', 'ending', 'hook']]
  ];

  for (const [category, terms] of categoryMatchers) {
    if (terms.some((term) => text.includes(term))) {
      return category;
    }
  }

  return AXIOS_EDITOR_SKILL_CATEGORIES.includes('analytics') ? 'analytics' : 'story';
}

function inferEvidence(category: AxiosEditorSkillCategory): string[] {
  switch (category) {
    case 'brand':
      return ['Axios brand profile', 'graphics tracks', 'colors', 'fonts', 'logo use', 'caption style'];
    case 'social':
      return ['transcript moments', 'platform target', 'clip boundaries', 'hook strength'];
    case 'visuals':
      return ['timeline visuals', 'B-roll placement', 'graphics tracks', 'screenshots', 'source asset availability'];
    case 'fact_checking':
      return ['claims', 'statistics', 'dates', 'names', 'source mentions'];
    case 'quality':
      return ['audio levels', 'silence gaps', 'captions', 'markers', 'sequence ends'];
    case 'export':
      return ['sequence settings', 'platform target', 'caption placement', 'safe areas'];
    case 'brevity':
      return ['transcript', 'filler words', 'repeated ideas', 'long answers'];
    case 'story':
      return ['opening', 'story beats', 'section order', 'ending'];
    case 'analytics':
    case 'continuity':
    case 'versioning':
      return ['active sequence', 'transcript', 'markers', 'track layout'];
    default:
      return ['active sequence', 'transcript', 'markers'];
  }
}

function inferOutputs(category: AxiosEditorSkillCategory, desiredOutcome: string | undefined): string[] {
  const common = ['timecoded recommendations', 'editor action list', 'confidence notes'];
  if (desiredOutcome !== undefined && desiredOutcome.trim().length > 0) {
    return [desiredOutcome.trim(), ...common];
  }

  if (category === 'brand') {
    return ['brand compliance verdict', 'fix recommendations', ...common];
  }

  if (category === 'social') {
    return ['clip candidates', 'platform-specific framing', ...common];
  }

  return common;
}

function inferPremiereTools(category: AxiosEditorSkillCategory): string[] {
  const baseTools = ['get_active_sequence', 'list_sequence_tracks', 'read_sequence_captions', 'add_marker'];
  if (category === 'export') {
    return ['get_sequence_settings', 'export_sequence', ...baseTools];
  }

  if (category === 'visuals' || category === 'brand') {
    return ['get_clip_properties', 'import_media', ...baseTools];
  }

  return baseTools;
}

function buildDescription(name: string, request: string): string {
  return `${name} handles repeated Axios editor requests like: ${request}`;
}

function buildPromotionScore(requestCount: number, exampleCount: number, hasDesiredOutcome: boolean): number {
  const requestScore = Math.min(requestCount * 20, 60);
  const exampleScore = Math.min(exampleCount * 10, 30);
  const outcomeScore = hasDesiredOutcome ? 10 : 0;
  return Math.min(requestScore + exampleScore + outcomeScore, 100);
}
