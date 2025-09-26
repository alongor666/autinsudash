// predictive-filter-suggestions.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing predictive filter suggestions
 *  and highlighting potentially impacted KPIs based on user search input.
 *
 * - predictiveFilterSuggestions - The main function that takes user input and returns filter suggestions and KPI highlights.
 * - PredictiveFilterSuggestionsInput - The input type for the predictiveFilterSuggestions function.
 * - PredictiveFilterSuggestionsOutput - The output type for the predictiveFilterSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveFilterSuggestionsInputSchema = z.object({
  searchInput: z.string().describe('The user input string in the filter.'),
  availableFilters: z.array(z.string()).describe('A flat list of all available filter options across all dimensions.'),
  kpiList: z.array(z.string()).describe('The list of available KPIs.'),
  historicalUserBehavior: z.string().describe('Summary of historical user behavior related to filter selections and KPI views.')
});
export type PredictiveFilterSuggestionsInput = z.infer<typeof PredictiveFilterSuggestionsInputSchema>;

const PredictiveFilterSuggestionsOutputSchema = z.object({
  suggestedFilters: z
    .array(
      z.object({
        dimension: z.string().describe("The dimension of the filter (e.g., '三级机构', '业务类型')."),
        value: z.string().describe("The specific value for the filter dimension (e.g., '成都', '新车')."),
      })
    )
    .describe('Suggested filter dimension/value pairs based on the search input and historical user behavior.'),
  highlightedKpis: z.array(z.string()).describe('KPIs that are likely to be impacted based on the suggested filters and historical user behavior.'),
});
export type PredictiveFilterSuggestionsOutput = z.infer<typeof PredictiveFilterSuggestionsOutputSchema>;

export async function predictiveFilterSuggestions(input: PredictiveFilterSuggestionsInput): Promise<PredictiveFilterSuggestionsOutput> {
  // Prevent calling the AI with empty input, as it's not useful.
  if (!input.searchInput) {
    return { suggestedFilters: [], highlightedKpis: [] };
  }
  return predictiveFilterSuggestionsFlow(input);
}

const predictiveFilterSuggestionsPrompt = ai.definePrompt({
  name: 'predictiveFilterSuggestionsPrompt',
  input: {schema: PredictiveFilterSuggestionsInputSchema},
  output: {schema: PredictiveFilterSuggestionsOutputSchema},
  prompt: `You are an AI assistant for a car insurance dashboard. Your task is to provide concrete filter suggestions and highlight relevant KPIs based on the user's search query and historical behavior.

User's search input: "{{searchInput}}"

Here is a flat list of all available filter options:
{{#each availableFilters}}
- {{this}}
{{/each}}

Available KPIs:
{{#each kpiList}}
- {{this}}
{{/each}}

Historical user behavior summary: {{historicalUserBehavior}}

Based on the user's input, search through the available filter options and suggest the most relevant filter values. For each suggestion, you MUST identify its corresponding dimension. The dimension MUST be one of the following: 'policy_start_year', 'week_number', 'third_level_organization', 'business_type_category', 'insurance_type', 'coverage_type', 'is_new_energy_vehicle', 'is_transferred_vehicle'.

For example, if the user types "成都", and "成都" is in the list of options, you should identify that "成都" belongs to the 'third_level_organization' dimension and return { dimension: 'third_level_organization', value: '成都' }.
If the user types "新", you might suggest { dimension: 'business_type_category', value: '新车' } and { dimension: 'is_new_energy_vehicle', value: '是' }.

Also, identify which KPIs are likely to be most affected or important to watch based on the suggested filters.

Only return suggestions from the provided lists of available filters and KPIs. Return up to 5 filter suggestions.
Your response must be in JSON format.
`,
});

const predictiveFilterSuggestionsFlow = ai.defineFlow(
  {
    name: 'predictiveFilterSuggestionsFlow',
    inputSchema: PredictiveFilterSuggestionsInputSchema,
    outputSchema: PredictiveFilterSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await predictiveFilterSuggestionsPrompt(input);
    return output!;
  }
);
