import { z } from 'zod';
import type { MCPTool } from '../tools/index.js';
import {
  AXIOS_ASSET_KINDS,
  AXIOS_ASSET_TASK_TYPES,
  buildAxiosAssetStoragePlan,
  type AxiosAssetKind,
  type AxiosAssetTaskType
} from './assetStorage.js';
import { getAxiosBrandKnowledgeStatus, readAxiosBrandProfile } from './brandKnowledge.js';
import { planAxiosCustomEditorSkill, type AxiosCustomSkillPlanOptions } from './customSkills.js';
import {
  AXIOS_EDITOR_SKILL_CATEGORIES,
  buildAxiosEditorSkillPlan,
  listAxiosEditorSkills,
  type AxiosEditorSkillCategory,
  type AxiosEditorSkillPlanOptions
} from './editorSkills.js';

export class AxiosEditorTools {
  getAvailableTools(): MCPTool[] {
    return [
      {
        name: 'axios_list_editor_skills',
        description: 'Lists the Axios editor assistant skill catalog, including story, brevity, visuals, social, QC, fact-checking, analytics, export, and brand review roles.',
        inputSchema: z.object({
          category: z.enum(AXIOS_EDITOR_SKILL_CATEGORIES).optional().describe('Optional Axios skill category filter.'),
          includeBrandDependent: z.boolean().optional().describe('Whether to include skills that require the private Axios brand profile. Defaults to true.')
        })
      },
      {
        name: 'axios_plan_editor_skill_review',
        description: 'Creates a structured review prompt/checklist for one Axios editor assistant skill without making timeline changes.',
        inputSchema: z.object({
          skill: z.string().describe('Axios editor skill id or name, such as story_analyst, Smart Brevity Coach, or Brand Compliance Checker.'),
          sequenceId: z.string().optional().describe('Optional sequence ID. Defaults to the active sequence.'),
          transcriptPath: z.string().optional().describe('Optional local transcript path. If omitted, use active sequence captions/transcript.'),
          startTime: z.number().optional().describe('Optional review start time in seconds.'),
          endTime: z.number().optional().describe('Optional review end time in seconds.'),
          platform: z.string().optional().describe('Optional platform target, such as YouTube, LinkedIn, Instagram, TikTok, or Shorts.'),
          includeBrandChecks: z.boolean().optional().describe('Whether the review should include Axios brand checks when applicable.'),
          notes: z.string().optional().describe('Optional editor context or constraints.')
        })
      },
      {
        name: 'axios_get_brand_knowledge_status',
        description: 'Checks whether the private Axios brand knowledge profile is installed locally and explains the safe repo/private storage policy.',
        inputSchema: z.object({
          profilePath: z.string().optional().describe('Optional repository-relative path to the private brand profile JSON.')
        })
      },
      {
        name: 'axios_read_brand_profile',
        description: 'Reads the private Axios brand profile JSON from the local repository when it exists. The raw PDF is not required at runtime.',
        inputSchema: z.object({
          profilePath: z.string().optional().describe('Optional repository-relative path to the private brand profile JSON.'),
          includePageText: z.boolean().optional().describe('Whether to include extracted page text. Defaults to false.'),
          maxSections: z.number().optional().describe('Maximum sections to return. Defaults to 12 and caps at 50.'),
          query: z.string().optional().describe('Optional query terms to filter brand profile sections.')
        })
      },
      {
        name: 'axios_plan_custom_editor_skill',
        description: 'Creates an organized draft plan for a new Axios editor skill when editors repeatedly ask for the same workflow.',
        inputSchema: z.object({
          request: z.string().describe('The repeated editor request or workflow the new skill should handle.'),
          name: z.string().optional().describe('Optional display name for the proposed skill.'),
          examples: z.array(z.string()).optional().describe('Real editor prompts that should trigger this skill.'),
          category: z.enum(AXIOS_EDITOR_SKILL_CATEGORIES).optional().describe('Optional Axios skill category override.'),
          requestCount: z.number().optional().describe('How many times this workflow has come up.'),
          desiredOutcome: z.string().optional().describe('The concrete output editors expect.'),
          needsBrandProfile: z.boolean().optional().describe('Whether this skill needs the private Axios brand profile.')
        })
      },
      {
        name: 'axios_plan_asset_storage',
        description: 'Returns the standard local folder and filename plan for generated frames, graphics, exports, analysis, and other video assets.',
        inputSchema: z.object({
          projectSlug: z.string().describe('Short project or show slug, such as the-axios-show or ai-leaders-interview.'),
          assetKind: z.enum(AXIOS_ASSET_KINDS).optional().describe('Asset kind such as generated, frames, graphics, exports, or analysis.'),
          taskType: z.enum(AXIOS_ASSET_TASK_TYPES).optional().describe('Workflow type such as fact_check, title_graphics, social_clip, or brand_review.'),
          filename: z.string().optional().describe('Optional source or desired filename.'),
          extension: z.string().optional().describe('Optional file extension override.'),
          date: z.string().optional().describe('Optional YYYY-MM-DD date folder. Defaults to today.')
        })
      }
    ];
  }

  executeTool(name: string, args: Record<string, any>): any {
    const tool = this.getAvailableTools().find((candidate) => candidate.name === name);
    if (!tool) {
      return {
        success: false,
        error: `Axios tool '${name}' not found`,
        availableTools: this.getAvailableTools().map((candidate) => candidate.name)
      };
    }

    try {
      tool.inputSchema.parse(args);
    } catch (error) {
      return {
        success: false,
        error: `Invalid arguments for Axios tool '${name}': ${error}`
      };
    }

    switch (name) {
      case 'axios_list_editor_skills':
        return this.listSkills(args.category, args.includeBrandDependent);
      case 'axios_plan_editor_skill_review':
        return buildAxiosEditorSkillPlan(args as AxiosEditorSkillPlanOptions);
      case 'axios_get_brand_knowledge_status':
        return getAxiosBrandKnowledgeStatus({ profilePath: args.profilePath });
      case 'axios_read_brand_profile':
        return readAxiosBrandProfile({
          profilePath: args.profilePath,
          includePageText: args.includePageText,
          maxSections: args.maxSections,
          query: args.query
        });
      case 'axios_plan_custom_editor_skill':
        return planAxiosCustomEditorSkill(args as AxiosCustomSkillPlanOptions);
      case 'axios_plan_asset_storage':
        return buildAxiosAssetStoragePlan({
          projectSlug: args.projectSlug,
          ...(args.assetKind === undefined ? {} : { assetKind: args.assetKind as AxiosAssetKind }),
          ...(args.taskType === undefined ? {} : { taskType: args.taskType as AxiosAssetTaskType }),
          ...(args.filename === undefined ? {} : { filename: args.filename }),
          ...(args.extension === undefined ? {} : { extension: args.extension }),
          ...(args.date === undefined ? {} : { date: args.date })
        });
      default:
        return {
          success: false,
          error: `Axios tool '${name}' not implemented`
        };
    }
  }

  hasTool(name: string): boolean {
    return this.getAvailableTools().some((tool) => tool.name === name);
  }

  private listSkills(category?: AxiosEditorSkillCategory, includeBrandDependent = true): any {
    const skills = listAxiosEditorSkills(category, includeBrandDependent);
    return {
      success: true,
      total: skills.length,
      category: category ?? 'all',
      includeBrandDependent,
      skills,
      privateBrandGuidance:
        'Keep raw Axios brand guideline PDFs out of public forks. Use a private repo or approved private source before adding the brand profile.'
    };
  }
}
