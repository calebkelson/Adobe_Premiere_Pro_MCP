import path from 'node:path';

export const AXIOS_ASSET_KINDS = [
  'source',
  'generated',
  'frames',
  'graphics',
  'audio',
  'exports',
  'analysis',
  'cache'
] as const;

export const AXIOS_ASSET_TASK_TYPES = [
  'general',
  'fact_check',
  'subtitles',
  'title_graphics',
  'thumbnail',
  'b_roll',
  'social_clip',
  'brand_review',
  'qc',
  'custom_skill'
] as const;

export type AxiosAssetKind = (typeof AXIOS_ASSET_KINDS)[number];
export type AxiosAssetTaskType = (typeof AXIOS_ASSET_TASK_TYPES)[number];

export interface AxiosAssetStoragePlanOptions {
  readonly projectSlug: string;
  readonly assetKind?: AxiosAssetKind;
  readonly taskType?: AxiosAssetTaskType;
  readonly filename?: string;
  readonly extension?: string;
  readonly date?: string;
}

export interface AxiosAssetStoragePlan {
  readonly success: true;
  readonly root: string;
  readonly projectRoot: string;
  readonly taskRoot: string;
  readonly directories: readonly string[];
  readonly suggestedPath: string;
  readonly namingRules: readonly string[];
}

const DEFAULT_WORKSPACE_ROOT = 'workspace/projects';

export function buildAxiosAssetStoragePlan(options: AxiosAssetStoragePlanOptions): AxiosAssetStoragePlan {
  const projectSlug = slugify(options.projectSlug) || 'untitled-project';
  const taskType = options.taskType ?? 'general';
  const assetKind = options.assetKind ?? 'generated';
  const date = normalizeDate(options.date);
  const basename = buildAssetBasename(options.filename, assetKind, taskType);
  const extension = normalizeExtension(options.extension ?? inferExtension(options.filename, assetKind));

  const projectRoot = path.posix.join(DEFAULT_WORKSPACE_ROOT, projectSlug);
  const taskRoot = path.posix.join(projectRoot, taskType);
  const assetRoot = path.posix.join(taskRoot, assetKind, date);
  const suggestedPath = path.posix.join(assetRoot, `${basename}.${extension}`);

  return {
    success: true,
    root: DEFAULT_WORKSPACE_ROOT,
    projectRoot,
    taskRoot,
    directories: [
      path.posix.join(projectRoot, 'source'),
      path.posix.join(projectRoot, 'analysis'),
      path.posix.join(projectRoot, 'exports'),
      path.posix.join(taskRoot, 'generated'),
      path.posix.join(taskRoot, 'frames'),
      path.posix.join(taskRoot, 'graphics'),
      path.posix.join(taskRoot, 'cache')
    ],
    suggestedPath,
    namingRules: [
      'Keep source assets separate from generated assets.',
      'Group generated frames, graphics, and analysis files by project, task, asset kind, and date.',
      'Use lowercase slug filenames so files are easy to reference from Premiere, scripts, and MCP tools.',
      'For thumbnails, create a complete finished PNG first, then an editable workspace package with source frames and separate transparent components when practical.',
      'Treat workspace/projects as disposable local output unless a file is promoted into an approved template or asset folder.'
    ]
  };
}

function buildAssetBasename(filename: string | undefined, assetKind: AxiosAssetKind, taskType: AxiosAssetTaskType): string {
  if (filename === undefined || filename.trim().length === 0) {
    return `${assetKind}-${taskType}`;
  }

  const parsed = path.posix.parse(filename.replace(/\\/g, '/'));
  return slugify(parsed.name) || `${assetKind}-${taskType}`;
}

function inferExtension(filename: string | undefined, assetKind: AxiosAssetKind): string {
  if (filename !== undefined) {
    const parsed = path.posix.parse(filename.replace(/\\/g, '/'));
    const extension = parsed.ext.replace(/^\./, '');
    if (extension.length > 0) {
      return extension;
    }
  }

  switch (assetKind) {
    case 'analysis':
      return 'json';
    case 'audio':
      return 'wav';
    case 'exports':
      return 'mp4';
    case 'frames':
    case 'graphics':
    case 'generated':
    case 'source':
    case 'cache':
      return 'png';
    default:
      return 'dat';
  }
}

function normalizeExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase().replace(/^\./, '').replace(/[^a-z0-9]+/g, '');
  return normalized || 'dat';
}

function normalizeDate(date: string | undefined): string {
  if (date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
