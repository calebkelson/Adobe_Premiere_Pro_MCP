import { planAxiosCustomEditorSkill } from '../../axios/customSkills.js';

describe('Axios custom skill planning', () => {
  it('turns repeated asks into an organized draft skill', () => {
    const result = planAxiosCustomEditorSkill({
      request: 'Build a recurring opener review for Axios show edits.',
      examples: ['Check the opening again', 'Is this hook strong enough?', 'Suggest a better beginning'],
      requestCount: 3
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.draft.category).toBe('story');
      expect(result.draft.triggerPhrases).toHaveLength(3);
      expect(result.organization.implementationPath).toContain('src/axios/skills/');
    }
  });

  it('rejects empty custom skill requests', () => {
    const result = planAxiosCustomEditorSkill({
      request: '   '
    });

    expect(result.success).toBe(false);
  });
});
