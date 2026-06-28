import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  DEFAULT_AXIOS_BRAND_PROFILE_PATH,
  getAxiosBrandKnowledgeStatus,
  readAxiosBrandProfile
} from '../../axios/brandKnowledge.js';

describe('Axios brand knowledge', () => {
  it('reports the default private profile path', () => {
    const status = getAxiosBrandKnowledgeStatus();

    expect(status.success).toBe(true);
    expect(status.defaultProfilePath).toBe(DEFAULT_AXIOS_BRAND_PROFILE_PATH);
    expect(status.guidance.join(' ')).toContain('raw Axios brand PDFs');
  });

  it('reads a private brand profile from inside the repository', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'axios-brand-profile-'));
    const profilePath = path.join(root, DEFAULT_AXIOS_BRAND_PROFILE_PATH);
    mkdirSync(path.dirname(profilePath), { recursive: true });
    writeFileSync(
      profilePath,
      JSON.stringify({
        profileVersion: 'test',
        generatedAt: '2026-06-28T00:00:00.000Z',
        source: {
          fileName: 'brand.pdf',
          sha256: 'abc123',
          pages: 1
        },
        usage: {
          visibility: 'private',
          commitPolicy: 'test only'
        },
        sections: [
          {
            page: 1,
            heading: 'Colors',
            text: 'Use approved Axios colors for brand graphics.',
            wordCount: 7
          }
        ]
      })
    );

    const result = readAxiosBrandProfile({
      repositoryRoot: root,
      includePageText: true,
      query: 'colors'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.source.fileName).toBe('brand.pdf');
      expect(result.returnedSections).toBe(1);
      expect(result.sections[0]).toMatchObject({
        page: 1,
        heading: 'Colors',
        text: 'Use approved Axios colors for brand graphics.'
      });
    }
  });
});
