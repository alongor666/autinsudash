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
  historicalUserBehavior: z.string().describe('Summary of historical user behavior related to filter selections and KPI views.'),
  aliases: z.array(z.object({ name: z.string(), description: z.string()})).describe('A list of business aliases that represent a combination of business type filters.')
});
export type PredictiveFilterSuggestionsInput = z.infer<typeof PredictiveFilterSuggestionsInputSchema>;

const PredictiveFilterSuggestionsOutputSchema = z.object({
  suggestedFilters: z
    .array(
      z.object({
        dimension: z.string().describe("The dimension of the filter (e.g., 'region', 'business_type_category')."),
        value: z.string().describe("The specific value for the filter dimension (e.g., '成都', '新车', or a business alias like '货车')."),
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
  prompt: `You are an AI assistant for a car insurance dashboard. Your task is to provide concrete filter suggestions and highlight relevant KPIs based on the user's search query.

User's search input: "{{searchInput}}"

Here is a list of business aliases that represent complex filter combinations. Prioritize matching these if the user input is similar.
{{#each aliases}}
- {{this.name}}: {{this.description}}
{{/each}}

Here is a flat list of all available filter options:
{{#each availableFilters}}
- {{this}}
{{/each}}

Available KPIs:
{{#each kpiList}}
- {{this}}
{{/each}}

Your goal is to understand the user's intent and map it to a specific filter or a business alias.

1.  **Check for Alias Match First**: If the user's input (e.g., "货车", "家自车") matches one of the business aliases, you MUST return a suggestion with the dimension 'business_type_category' and the value being the alias name. For example, for "货车", return \`{ dimension: 'business_type_category', value: '货车' }\`.

2.  **If No Alias, Check for Direct Filter Match**: If the input does not match an alias, search through the 'availableFilters' list. For each match, you MUST identify its corresponding dimension. The dimension MUST be one of the following: 'year', 'weekNumber', 'region', 'business_type_category', 'insurance_type', 'coverage_type', 'is_new_energy_vehicle', 'is_transferred_vehicle'.

    *   For "成都", return \`{ dimension: 'region', value: '成都' }\`.
    *   For "新车", return \`{ dimension: 'business_type_category', value: '新车' }\`.
    *   For "2023", return \`{ dimension: 'year', value: '2023' }\`.

3.  **Highlight KPIs**: Identify which KPIs are likely to be most affected or important to watch based on the suggested filters.

Only return suggestions from the provided lists. Return up to 3 relevant filter suggestions. Your response must be in JSON format.
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
