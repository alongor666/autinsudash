'use server';

/**
 * @fileOverview Defines a Genkit flow for generating a natural language summary of applied filters.
 *
 * - generateFilterSummary - The main function that takes filter data and returns a string summary.
 * - GenerateFilterSummaryInput - The input type for the generateFilterSummary function.
 * - GenerateFilterSummaryOutput - The output type for the generateFilterSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Filters } from '@/lib/types';


const GenerateFilterSummaryInputSchema = z.object({
  year: z.string().nullable(),
  region: z.string().nullable(),
  weekNumber: z.string().nullable(),
  businessTypes: z.array(z.string()).nullable(),
  insuranceTypes: z.array(z.string()).nullable(),
  newEnergyStatus: z.array(z.string()).nullable(),
  transferredStatus: z.array(z.string()).nullable(),
  coverageTypes: z.array(z.string()).nullable(),
}).describe("An object representing the currently applied filters on the dashboard.");
export type GenerateFilterSummaryInput = z.infer<typeof GenerateFilterSummaryInputSchema>;


const GenerateFilterSummaryOutputSchema = z.string().describe("A concise, natural language summary of the applied filters.");
export type GenerateFilterSummaryOutput = z.infer<typeof GenerateFilterSummaryOutputSchema>;


export async function generateFilterSummary(input: Filters): Promise<GenerateFilterSummaryOutput> {
  return generateFilterSummaryFlow(input);
}


const generateFilterSummaryPrompt = ai.definePrompt({
  name: 'generateFilterSummaryPrompt',
  input: { schema: GenerateFilterSummaryInputSchema },
  output: { schema: GenerateFilterSummaryOutputSchema },
  prompt: `You are an expert at creating concise and natural language summaries for a dashboard based on a filter object.

Your task is to generate a summary string following this exact format: "[三级机构][保单年度]年保单第[周序号]周[业务类型]经营概况".

IMPORTANT RULES:
1.  If a filter is not present or is an empty array, its corresponding part in the title (including connecting words like "年保单", "第...周") MUST be omitted.
2.  If multiple values exist for a filter (like businessTypes), combine them with a "、" character.
3.  If no filters are applied at all (input is empty or all values are null/empty), the summary MUST be "全量数据经营概况".
4.  Do not add any extra words, explanations, or labels like "当前筛选：". Only return the generated summary string.

Here are some examples to follow strictly:
- Input: { year: '2024', region: '天府', businessTypes: null, weekNumber: null }
  Output: 天府2024年经营概况
- Input: { year: '2024', region: '天府', businessTypes: ['新车'], weekNumber: '38' }
  Output: 天府2024年保单第38周新车业务经营概况
- Input: { year: null, region: null, businessTypes: ['新车', '续保'], weekNumber: null }
  Output: 新车、续保业务经营概况
- Input: { year: '2023', region: null, weekNumber: '52' }
  Output: 2023年保单第52周经营概况

Now, generate a summary for the following filter data:
- 保单年度(year): {{year}}
- 三级机构(region): {{region}}
- 周序号(weekNumber): {{weekNumber}}
- 业务类型(businessTypes): {{#if businessTypes}}{{join businessTypes '、'}}{{/if}}
- 车险种类(insuranceTypes): {{#if insuranceTypes}}{{join insuranceTypes '、'}}{{/if}}
- 是否新能源(newEnergyStatus): {{#if newEnergyStatus}}{{join newEnergyStatus '、'}}{{/if}}
- 是否过户车(transferredStatus): {{#if transferredStatus}}{{join transferredStatus '、'}}{{/if}}
- 险别组合(coverageTypes): {{#if coverageTypes}}{{join coverageTypes '、'}}{{/if}}
`,
});

const generateFilterSummaryFlow = ai.defineFlow(
  {
    name: 'generateFilterSummaryFlow',
    inputSchema: GenerateFilterSummaryInputSchema,
    outputSchema: GenerateFilterSummaryOutputSchema,
  },
  async (input) => {
    const activeFilters = Object.entries(input).filter(([, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null && value !== undefined && value !== '';
    });

    if (activeFilters.length === 0) {
        return '全量数据经营概况';
    }

    const { output } = await generateFilterSummaryPrompt(input);
    return output!;
  }
);
