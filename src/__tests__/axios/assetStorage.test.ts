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

  it('includes editable package guidance for thumbnail work', () => {
    const result = buildAxiosAssetStoragePlan({
      projectSlug: 'The Axios Show',
      taskType: 'thumbnail',
      assetKind: 'graphics',
      filename: 'Mike Allen AI Jobs Thumbnail.png',
      date: '2026-06-28'
    });

    expect(result.taskRoot).toBe('workspace/projects/the-axios-show/thumbnail');
    expect(result.suggestedPath).toBe('workspace/projects/the-axios-show/thumbnail/graphics/2026-06-28/mike-allen-ai-jobs-thumbnail.png');
    expect(result.namingRules).toContain(
      'For thumbnails, create a complete finished PNG first, then an editable workspace package with source frames and separate transparent components when practical.'
    );
  });
});
