import { z } from 'zod';
import type { MCPTool } from '../tools/index.js';
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
