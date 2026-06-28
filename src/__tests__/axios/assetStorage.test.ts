import { buildAxiosAssetStoragePlan } from '../../axios/assetStorage.js';

describe('Axios asset storage', () => {
  it('builds stable generated asset paths', () => {
    const result = buildAxiosAssetStoragePlan({
      projectSlug: 'AI Leaders Interview',
      taskType: 'fact_check',
      assetKind: 'graphics',
      filename: 'Fact Check Card 01.png',
      date: '2026-06-28'
    });

    expect(result.projectRoot).toBe('workspace/projects/ai-leaders-interview');
    expect(result.suggestedPath).toBe('workspace/projects/ai-leaders-interview/fact_check/graphics/2026-06-28/fact-check-card-01.png');
  });
});
