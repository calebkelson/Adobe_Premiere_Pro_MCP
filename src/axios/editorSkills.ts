export const AXIOS_EDITOR_SKILL_CATEGORIES = [
  'story',
  'brevity',
  'visuals',
  'social',
  'quality',
  'fact_checking',
  'analytics',
  'continuity',
  'versioning',
  'export',
  'brand'
] as const;

export type AxiosEditorSkillCategory = (typeof AXIOS_EDITOR_SKILL_CATEGORIES)[number];

export interface AxiosEditorSkill {
  readonly id: string;
  readonly name: string;
  readonly category: AxiosEditorSkillCategory;
  readonly description: string;
  readonly evidenceToReview: readonly string[];
  readonly primaryOutputs: readonly string[];
  readonly markerTypes: readonly string[];
  readonly recommendedPremiereTools: readonly string[];
  readonly requiresBrandProfile: boolean;
}

export interface AxiosEditorSkillSummary {
  readonly id: string;
  readonly name: string;
  readonly category: AxiosEditorSkillCategory;
  readonly description: string;
  readonly primaryOutputs: readonly string[];
  readonly requiresBrandProfile: boolean;
}

export interface AxiosEditorSkillPlanOptions {
  readonly skill: string;
  readonly sequenceId?: string;
  readonly transcriptPath?: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly platform?: string;
  readonly includeBrandChecks?: boolean;
  readonly notes?: string;
}

export interface AxiosEditorSkillPlan {
  readonly success: true;
  readonly skill: AxiosEditorSkill;
  readonly scope: {
    readonly sequenceId: string;
    readonly transcriptPath: string | null;
    readonly timeRange: string;
    readonly platform: string | null;
    readonly notes: string | null;
  };
  readonly evidenceChecklist: readonly string[];
  readonly outputTemplate: readonly string[];
  readonly markerPlan: readonly string[];
  readonly recommendedPremiereTools: readonly string[];
  readonly prompt: string;
  readonly privateKnowledgeNote: string | null;
}

export interface AxiosEditorSkillPlanError {
  readonly success: false;
  readonly error: string;
  readonly availableSkills: readonly string[];
}

export type AxiosEditorSkillPlanResult = AxiosEditorSkillPlan | AxiosEditorSkillPlanError;

const PRIVATE_BRAND_PROFILE_NOTE =
  'This skill should use the curated Axios brand profile after the repository is private/Axios-only. Do not commit raw proprietary brand PDFs to a public fork.';

export const AXIOS_EDITOR_SKILLS: readonly AxiosEditorSkill[] = [
  {
    id: 'story_analyst',
    name: 'Story Analyst',
    category: 'story',
    description: 'Reviews the timeline and transcript to identify weak openings, repetitive sections, pacing issues, and stronger story structures.',
    evidenceToReview: ['opening 30 seconds', 'sequence outline', 'transcript beats', 'marker notes', 'scene durations'],
    primaryOutputs: ['stronger opening options', 'suggested story structure', 'repetition notes', 'pacing issues', 'recommended trims'],
    markerTypes: ['weak_opening', 'story_gap', 'repetition', 'pacing_drag', 'strong_ending'],
    recommendedPremiereTools: ['get_active_sequence', 'list_sequence_tracks', 'list_markers', 'read_sequence_captions'],
    requiresBrandProfile: false
  },
  {
    id: 'smart_brevity_coach',
    name: 'Smart Brevity Coach',
    category: 'brevity',
    description: 'Suggests cuts and rewrites that make the edit shorter, clearer, and more aligned with concise Axios-style explanatory storytelling.',
    evidenceToReview: ['full transcript', 'repeated setup lines', 'long answers', 'unclear sentences', 'intro and outro'],
    primaryOutputs: ['cut list', 'rewrite suggestions', 'shorter headline framing', 'clearer section summaries'],
    markerTypes: ['cut_for_brevity', 'rewrite_for_clarity', 'filler', 'summary_needed'],
    recommendedPremiereTools: ['read_sequence_captions', 'list_sequence_tracks', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'b_roll_director',
    name: 'B-Roll Director',
    category: 'visuals',
    description: 'Recommends where to add B-roll, graphics, screenshots, or archival footage based on what is being discussed.',
    evidenceToReview: ['talking-head stretches', 'topic changes', 'proper nouns', 'abstract explanations', 'existing B-roll placement'],
    primaryOutputs: ['B-roll needs list', 'visual search terms', 'suggested placement times', 'coverage gaps'],
    markerTypes: ['broll_needed', 'screenshot_needed', 'archive_needed', 'visual_gap'],
    recommendedPremiereTools: ['list_sequence_tracks', 'get_clip_at_position', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'graphics_assistant',
    name: 'Graphics Assistant',
    category: 'visuals',
    description: 'Detects statistics, names, quotes, and key moments that would benefit from lower thirds, charts, or on-screen graphics.',
    evidenceToReview: ['statistics', 'names and titles', 'quotes', 'definitions', 'key timeline moments'],
    primaryOutputs: ['lower-third candidates', 'chart candidates', 'quote cards', 'graphic copy', 'placement times'],
    markerTypes: ['lower_third', 'chart_needed', 'quote_card', 'key_graphic'],
    recommendedPremiereTools: ['read_sequence_captions', 'add_marker', 'add_text_overlay', 'import_mogrt'],
    requiresBrandProfile: true
  },
  {
    id: 'social_producer',
    name: 'Social Producer',
    category: 'social',
    description: 'Finds the strongest moments in a long edit and creates platform-specific clip recommendations for YouTube, LinkedIn, Instagram, TikTok, and Shorts.',
    evidenceToReview: ['hook moments', 'self-contained answers', 'emotional peaks', 'surprising claims', 'clean start/end points'],
    primaryOutputs: ['clip candidates', 'platform fit', 'suggested durations', 'titles', 'caption framing'],
    markerTypes: ['social_hook', 'shorts_candidate', 'linkedin_clip', 'youtube_moment', 'clean_out'],
    recommendedPremiereTools: ['list_sequence_tracks', 'read_sequence_captions', 'set_sequence_in_out_points', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'qc_editor',
    name: 'QC Editor',
    category: 'quality',
    description: 'Performs a final review for technical issues like long silences, audio peaks, caption problems, spelling errors, abrupt cuts, and export readiness.',
    evidenceToReview: ['audio levels', 'silence gaps', 'captions', 'markers', 'export settings', 'sequence ends'],
    primaryOutputs: ['QC issue list', 'export readiness verdict', 'caption fixes', 'audio warnings', 'technical marker list'],
    markerTypes: ['qc_issue', 'audio_peak', 'caption_fix', 'abrupt_cut', 'export_blocker'],
    recommendedPremiereTools: ['list_sequence_tracks', 'read_sequence_captions', 'list_markers', 'get_sequence_settings'],
    requiresBrandProfile: false
  },
  {
    id: 'fact_check_assistant',
    name: 'Fact Check Assistant',
    category: 'fact_checking',
    description: 'Flags factual claims, statistics, dates, names, and quotes that should be verified before publishing.',
    evidenceToReview: ['claims', 'statistics', 'dates', 'names', 'quotes', 'source mentions'],
    primaryOutputs: ['fact-check queue', 'claim text', 'timecode', 'verification priority', 'source needed'],
    markerTypes: ['fact_check', 'stat_check', 'date_check', 'name_check', 'quote_check'],
    recommendedPremiereTools: ['read_sequence_captions', 'add_marker', 'list_markers'],
    requiresBrandProfile: false
  },
  {
    id: 'timeline_analyst',
    name: 'Timeline Analyst',
    category: 'analytics',
    description: 'Generates an overview of the edit with metrics like talking-head time, B-roll percentage, pacing, filler words, silence, and scene lengths.',
    evidenceToReview: ['track layout', 'clip durations', 'caption text', 'silence gaps', 'visual track usage'],
    primaryOutputs: ['timeline metrics', 'talking-head percentage', 'B-roll percentage', 'scene length table', 'pacing notes'],
    markerTypes: ['long_scene', 'visual_density_low', 'silence', 'metric_note'],
    recommendedPremiereTools: ['list_sequence_tracks', 'read_sequence_captions', 'list_markers'],
    requiresBrandProfile: false
  },
  {
    id: 'marker_generator',
    name: 'Marker Generator',
    category: 'analytics',
    description: 'Automatically places color-coded Premiere markers for strong quotes, edit opportunities, B-roll needs, graphics, and potential issues.',
    evidenceToReview: ['transcript moments', 'timeline gaps', 'visual needs', 'QC issues', 'strong quotes'],
    primaryOutputs: ['color-coded marker plan', 'marker names', 'marker comments', 'marker durations'],
    markerTypes: ['strong_quote', 'edit_opportunity', 'broll_needed', 'graphic_needed', 'potential_issue'],
    recommendedPremiereTools: ['add_marker', 'list_markers', 'read_sequence_captions'],
    requiresBrandProfile: false
  },
  {
    id: 'continuity_checker',
    name: 'Continuity Checker',
    category: 'continuity',
    description: 'Identifies inconsistent terminology, missing explanations, repeated concepts, or narrative gaps across the timeline.',
    evidenceToReview: ['full transcript', 'topic order', 'names and terms', 'definitions', 'story transitions'],
    primaryOutputs: ['continuity issues', 'terminology fixes', 'missing context', 'transition suggestions'],
    markerTypes: ['continuity_gap', 'term_inconsistent', 'missing_context', 'repeat_concept'],
    recommendedPremiereTools: ['read_sequence_captions', 'list_markers', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'version_comparison',
    name: 'Version Comparison',
    category: 'versioning',
    description: 'Compares two edits and summarizes exactly what changed between them, including cuts, moved sections, graphics, and audio changes.',
    evidenceToReview: ['two sequence timelines', 'clip order', 'durations', 'markers', 'graphics tracks', 'audio tracks'],
    primaryOutputs: ['change summary', 'cut list', 'moved sections', 'graphics changes', 'audio changes'],
    markerTypes: ['changed_section', 'moved_section', 'removed_clip', 'new_graphic', 'audio_change'],
    recommendedPremiereTools: ['list_sequences', 'list_sequence_tracks', 'list_markers'],
    requiresBrandProfile: false
  },
  {
    id: 'ask_the_timeline',
    name: 'Ask the Timeline',
    category: 'analytics',
    description: 'Lets editors ask natural-language questions about the current project, such as where a topic appears or what the strongest ending is.',
    evidenceToReview: ['current sequence', 'transcript', 'markers', 'selected clips', 'project metadata'],
    primaryOutputs: ['direct answer', 'supporting timecodes', 'relevant clips', 'follow-up edit options'],
    markerTypes: ['answer_moment', 'follow_up', 'reference'],
    recommendedPremiereTools: ['get_active_sequence', 'list_sequence_tracks', 'read_sequence_captions', 'list_markers'],
    requiresBrandProfile: false
  },
  {
    id: 'highlight_finder',
    name: 'Highlight Finder',
    category: 'social',
    description: 'Scores every segment by engagement potential and surfaces the best hooks, quotes, reactions, and memorable moments.',
    evidenceToReview: ['hooks', 'memorable quotes', 'reaction moments', 'topic stakes', 'clean clip boundaries'],
    primaryOutputs: ['ranked highlights', 'engagement score', 'reason for score', 'clip boundaries'],
    markerTypes: ['highlight', 'hook', 'memorable_quote', 'reaction', 'strong_close'],
    recommendedPremiereTools: ['read_sequence_captions', 'list_sequence_tracks', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'interview_cleaner',
    name: 'Interview Cleaner',
    category: 'brevity',
    description: 'Detects filler words, awkward pauses, repeated answers, tangents, and rambling sections while preserving the speaker natural flow.',
    evidenceToReview: ['filler words', 'pauses', 'false starts', 'repeated answers', 'tangents'],
    primaryOutputs: ['cleaning cut list', 'safe trims', 'flow-preserving notes', 'risky cut warnings'],
    markerTypes: ['filler_cut', 'pause_trim', 'repeat_answer', 'tangent', 'keep_for_flow'],
    recommendedPremiereTools: ['read_sequence_captions', 'razor_timeline_at_time', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'export_optimizer',
    name: 'Export Optimizer',
    category: 'export',
    description: 'Recommends the best export settings, aspect ratios, caption positioning, and deliverables for each publishing platform.',
    evidenceToReview: ['sequence settings', 'target platforms', 'caption placement', 'safe areas', 'export presets'],
    primaryOutputs: ['export settings', 'aspect ratio plan', 'caption placement', 'deliverable checklist'],
    markerTypes: ['export_note', 'safe_area_issue', 'caption_position', 'platform_version'],
    recommendedPremiereTools: ['get_sequence_settings', 'export_sequence', 'auto_reframe_sequence'],
    requiresBrandProfile: true
  },
  {
    id: 'thumbnail_title_assistant',
    name: 'Thumbnail & Title Assistant',
    category: 'social',
    description: 'Creates complete thumbnail concepts, compelling titles, key frame candidates, and editable thumbnail asset packages based on the strongest moments in the edit.',
    evidenceToReview: ['strongest moments', 'faces/reactions', 'key frames', 'topic stakes', 'platform target', 'editable thumbnail components'],
    primaryOutputs: ['title options', 'complete thumbnail concept', 'key frame candidates', 'editable thumbnail package plan', 'A/B test options'],
    markerTypes: ['thumbnail_frame', 'title_hook', 'key_reaction', 'candidate_frame'],
    recommendedPremiereTools: ['export_frame', 'read_sequence_captions', 'add_marker'],
    requiresBrandProfile: true
  },
  {
    id: 'music_pacing_advisor',
    name: 'Music & Pacing Advisor',
    category: 'quality',
    description: 'Recommends where music should start, stop, build, or fade to better support the emotional pacing of the story.',
    evidenceToReview: ['story beats', 'silence gaps', 'emotional transitions', 'music track placement', 'audio ducking'],
    primaryOutputs: ['music cue plan', 'fade points', 'ducking notes', 'pacing rationale'],
    markerTypes: ['music_start', 'music_fade', 'music_build', 'ducking_needed', 'silence_keep'],
    recommendedPremiereTools: ['list_sequence_tracks', 'setup_ducking', 'add_audio_keyframes', 'add_marker'],
    requiresBrandProfile: false
  },
  {
    id: 'brand_compliance_checker',
    name: 'Brand Compliance Checker',
    category: 'brand',
    description: 'Verifies that the project follows Axios branding guidelines for fonts, colors, lower thirds, logos, captions, and other visual standards.',
    evidenceToReview: ['graphics tracks', 'lower thirds', 'logos', 'colors', 'fonts', 'caption style', 'export framing'],
    primaryOutputs: ['brand compliance issues', 'fix recommendations', 'approved/needs review verdict', 'asset replacement notes'],
    markerTypes: ['brand_issue', 'font_issue', 'color_issue', 'logo_issue', 'caption_style'],
    recommendedPremiereTools: ['list_sequence_tracks', 'get_clip_properties', 'list_markers', 'add_marker'],
    requiresBrandProfile: true
  }
];

export function listAxiosEditorSkills(
  category?: AxiosEditorSkillCategory,
  includeBrandDependent = true
): AxiosEditorSkillSummary[] {
  return AXIOS_EDITOR_SKILLS
    .filter((skill) => category === undefined || skill.category === category)
    .filter((skill) => includeBrandDependent || !skill.requiresBrandProfile)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      primaryOutputs: skill.primaryOutputs,
      requiresBrandProfile: skill.requiresBrandProfile
    }));
}

export function getAxiosEditorSkill(skillKey: string): AxiosEditorSkill | undefined {
  const normalized = normalizeSkillKey(skillKey);
  return AXIOS_EDITOR_SKILLS.find((skill) => {
    return skill.id === normalized || normalizeSkillKey(skill.name) === normalized;
  });
}

export function buildAxiosEditorSkillPlan(options: AxiosEditorSkillPlanOptions): AxiosEditorSkillPlanResult {
  const skill = getAxiosEditorSkill(options.skill);
  if (!skill) {
    return {
      success: false,
      error: `Axios editor skill '${options.skill}' was not found.`,
      availableSkills: AXIOS_EDITOR_SKILLS.map((candidate) => candidate.id)
    };
  }

  const scope = {
    sequenceId: options.sequenceId ?? 'active_sequence',
    transcriptPath: options.transcriptPath ?? null,
    timeRange: formatTimeRange(options.startTime, options.endTime),
    platform: options.platform ?? null,
    notes: options.notes ?? null
  };
  const privateKnowledgeNote =
    skill.requiresBrandProfile || options.includeBrandChecks === true ? PRIVATE_BRAND_PROFILE_NOTE : null;

  return {
    success: true,
    skill,
    scope,
    evidenceChecklist: buildEvidenceChecklist(skill, options),
    outputTemplate: buildOutputTemplate(skill),
    markerPlan: buildMarkerPlan(skill),
    recommendedPremiereTools: skill.recommendedPremiereTools,
    prompt: buildSkillPrompt(skill, scope, privateKnowledgeNote),
    privateKnowledgeNote
  };
}

function buildEvidenceChecklist(skill: AxiosEditorSkill, options: AxiosEditorSkillPlanOptions): string[] {
  const checklist = [
    `Review: ${skill.evidenceToReview.join(', ')}.`,
    'Capture exact timecodes for every note.',
    'Separate high-confidence findings from judgment calls.',
    'Avoid changing the timeline until the editor approves the recommendation list.'
  ];

  if (options.transcriptPath === undefined) {
    checklist.push('Use captions or transcript extraction from the active sequence when no transcript path is provided.');
  }

  if (skill.requiresBrandProfile) {
    checklist.push('Load the curated Axios brand profile before making brand, graphic, font, color, or layout judgments.');
  }

  return checklist;
}

function buildOutputTemplate(skill: AxiosEditorSkill): string[] {
  return [
    `Return: ${skill.primaryOutputs.join(', ')}.`,
    'For each recommendation include timecode, issue/opportunity, rationale, and suggested editor action.',
    'Group findings by priority: publish blocker, strong recommendation, optional polish.',
    'When applicable, propose marker names and comments that can be placed in Premiere.'
  ];
}

function buildMarkerPlan(skill: AxiosEditorSkill): string[] {
  return skill.markerTypes.map((markerType) => {
    return `${markerType}: use when the timeline contains a ${markerType.replace(/_/g, ' ')} moment.`;
  });
}

function buildSkillPrompt(
  skill: AxiosEditorSkill,
  scope: AxiosEditorSkillPlan['scope'],
  privateKnowledgeNote: string | null
): string {
  const transcriptLine = scope.transcriptPath === null ? 'Use the active sequence captions/transcript.' : `Use transcript: ${scope.transcriptPath}.`;
  const platformLine = scope.platform === null ? 'No platform override was provided.' : `Optimize recommendations for ${scope.platform}.`;
  const notesLine = scope.notes === null ? 'No extra editor notes were provided.' : `Editor notes: ${scope.notes}`;
  const brandLine = privateKnowledgeNote === null ? '' : `\nPrivate knowledge note: ${privateKnowledgeNote}`;

  return [
    `Act as Axios ${skill.name}.`,
    skill.description,
    `Sequence scope: ${scope.sequenceId}. Time range: ${scope.timeRange}.`,
    transcriptLine,
    platformLine,
    notesLine,
    `Review evidence: ${skill.evidenceToReview.join(', ')}.`,
    `Produce: ${skill.primaryOutputs.join(', ')}.`,
    'Use precise timecodes and concise, editor-actionable language.',
    'Do not make destructive timeline edits without explicit editor approval.',
    brandLine
  ].filter((line) => line.length > 0).join('\n');
}

function formatTimeRange(startTime?: number, endTime?: number): string {
  if (startTime === undefined && endTime === undefined) {
    return 'full_sequence';
  }

  const start = startTime === undefined ? 'sequence_start' : `${startTime}s`;
  const end = endTime === undefined ? 'sequence_end' : `${endTime}s`;
  return `${start}-${end}`;
}

function normalizeSkillKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
