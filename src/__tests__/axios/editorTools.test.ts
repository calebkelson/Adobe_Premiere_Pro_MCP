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
});
