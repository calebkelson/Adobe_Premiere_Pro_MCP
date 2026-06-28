import { AxiosEditorTools } from '../../axios/editorTools.js';

describe('AxiosEditorTools', () => {
  let tools: AxiosEditorTools;

  beforeEach(() => {
    tools = new AxiosEditorTools();
  });

  it('exposes the Axios MCP tool entrypoints', () => {
    const toolNames = tools.getAvailableTools().map((tool) => tool.name);

    expect(toolNames).toContain('axios_list_editor_skills');
    expect(toolNames).toContain('axios_plan_editor_skill_review');
    expect(toolNames).toContain('axios_get_brand_knowledge_status');
    expect(toolNames).toContain('axios_read_brand_profile');
    expect(toolNames).toContain('axios_plan_custom_editor_skill');
    expect(toolNames).toContain('axios_plan_asset_storage');
  });

  it('lists Axios editor assistant skills', () => {
    const result = tools.executeTool('axios_list_editor_skills', {});

    expect(result.success).toBe(true);
    expect(result.total).toBe(18);
    expect(result.skills.map((skill: any) => skill.id)).toContain('story_analyst');
    expect(result.skills.map((skill: any) => skill.id)).toContain('brand_compliance_checker');
  });

  it('filters Axios skills by category', () => {
    const result = tools.executeTool('axios_list_editor_skills', {
      category: 'brand'
    });

    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
    expect(result.skills[0].id).toBe('brand_compliance_checker');
  });

  it('plans an Axios editor skill review', () => {
    const result = tools.executeTool('axios_plan_editor_skill_review', {
      skill: 'Story Analyst',
      sequenceId: 'seq-123',
      startTime: 0,
      endTime: 240,
      notes: 'Focus on the first four minutes.'
    });

    expect(result.success).toBe(true);
    expect(result.skill.id).toBe('story_analyst');
    expect(result.scope.sequenceId).toBe('seq-123');
    expect(result.scope.timeRange).toBe('0s-240s');
    expect(result.prompt).toContain('Act as Axios Story Analyst');
  });

  it('returns a clear error for unknown Axios skills', () => {
    const result = tools.executeTool('axios_plan_editor_skill_review', {
      skill: 'Unknown Axios Skill'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('was not found');
    expect(result.availableSkills).toContain('story_analyst');
  });

  it('reports brand knowledge status without requiring the private profile to be committed', () => {
    const result = tools.executeTool('axios_get_brand_knowledge_status', {});

    expect(result.success).toBe(true);
    expect(result.defaultProfilePath).toBe('private/knowledge/axios-brand-profile.json');
    expect(result.publicExamplePath).toBe('knowledge/axios-brand-profile.example.json');
    expect(result.guidance.join(' ')).toContain('Do not commit');
  });

  it('plans a custom editor skill from repeated editor requests', () => {
    const result = tools.executeTool('axios_plan_custom_editor_skill', {
      request: 'Every time I ask for LinkedIn clips, give me a ranked social cut list.',
      examples: [
        'Find the best LinkedIn moments',
        'Make a social cut list for this interview',
        'What clips should become Shorts?'
      ],
      requestCount: 4,
      desiredOutcome: 'ranked social clip plan'
    });

    expect(result.success).toBe(true);
    expect(result.draft.category).toBe('social');
    expect(result.draft.primaryOutputs).toContain('ranked social clip plan');
    expect(result.promotion.score).toBeGreaterThanOrEqual(70);
    expect(result.organization.privateRequestLogPath).toContain('private/skill-requests/');
  });

  it('plans organized storage paths for generated assets', () => {
    const result = tools.executeTool('axios_plan_asset_storage', {
      projectSlug: 'The Axios Show',
      taskType: 'title_graphics',
      assetKind: 'graphics',
      filename: 'The Axios Show Intro.png',
      date: '2026-06-28'
    });

    expect(result.success).toBe(true);
    expect(result.projectRoot).toBe('workspace/projects/the-axios-show');
    expect(result.suggestedPath).toBe('workspace/projects/the-axios-show/title_graphics/graphics/2026-06-28/the-axios-show-intro.png');
  });
});
