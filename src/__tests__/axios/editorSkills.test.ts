import {
  AXIOS_EDITOR_SKILLS,
  buildAxiosEditorSkillPlan,
  getAxiosEditorSkill,
  listAxiosEditorSkills
} from '../../axios/editorSkills.js';

describe('Axios editor skills', () => {
  it('includes the initial Axios assistant catalog', () => {
    const skillIds = AXIOS_EDITOR_SKILLS.map((skill) => skill.id);

    expect(AXIOS_EDITOR_SKILLS).toHaveLength(18);
    expect(skillIds).toContain('story_analyst');
    expect(skillIds).toContain('smart_brevity_coach');
    expect(skillIds).toContain('b_roll_director');
    expect(skillIds).toContain('graphics_assistant');
    expect(skillIds).toContain('social_producer');
    expect(skillIds).toContain('qc_editor');
    expect(skillIds).toContain('fact_check_assistant');
    expect(skillIds).toContain('timeline_analyst');
    expect(skillIds).toContain('marker_generator');
    expect(skillIds).toContain('continuity_checker');
    expect(skillIds).toContain('version_comparison');
    expect(skillIds).toContain('ask_the_timeline');
    expect(skillIds).toContain('highlight_finder');
    expect(skillIds).toContain('interview_cleaner');
    expect(skillIds).toContain('export_optimizer');
    expect(skillIds).toContain('thumbnail_title_assistant');
    expect(skillIds).toContain('music_pacing_advisor');
    expect(skillIds).toContain('brand_compliance_checker');
  });

  it('finds skills by id or display name', () => {
    expect(getAxiosEditorSkill('story_analyst')?.name).toBe('Story Analyst');
    expect(getAxiosEditorSkill('Thumbnail & Title Assistant')?.id).toBe('thumbnail_title_assistant');
  });

  it('can omit brand-dependent skills from the list', () => {
    const skills = listAxiosEditorSkills(undefined, false);

    expect(skills.some((skill) => skill.id === 'brand_compliance_checker')).toBe(false);
    expect(skills.every((skill) => !skill.requiresBrandProfile)).toBe(true);
  });

  it('builds a review prompt for a selected skill', () => {
    const plan = buildAxiosEditorSkillPlan({
      skill: 'fact_check_assistant',
      sequenceId: 'seq-123',
      startTime: 0,
      endTime: 240
    });

    expect(plan.success).toBe(true);
    if (plan.success) {
      expect(plan.skill.name).toBe('Fact Check Assistant');
      expect(plan.scope.timeRange).toBe('0s-240s');
      expect(plan.prompt).toContain('Act as Axios Fact Check Assistant');
      expect(plan.markerPlan).toContain('fact_check: use when the timeline contains a fact check moment.');
    }
  });

  it('adds private brand guidance for brand-dependent skills', () => {
    const plan = buildAxiosEditorSkillPlan({
      skill: 'Brand Compliance Checker'
    });

    expect(plan.success).toBe(true);
    if (plan.success) {
      expect(plan.privateKnowledgeNote).toContain('Do not commit raw proprietary brand PDFs');
    }
  });
});
