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
  availableFilters: z.array(z.string()).describe('The list of available filters.'),
  kpiList: z.array(z.string()).describe('The list of available KPIs.'),
  historicalUserBehavior: z.string().describe('Summary of historical user behavior related to filter selections and KPI views.')
});
export type PredictiveFilterSuggestionsInput = z.infer<typeof PredictiveFilterSuggestionsInputSchema>;

const PredictiveFilterSuggestionsOutputSchema = z.object({
  suggestedFilters: z.array(z.string()).describe('Suggested filters based on the search input and historical user behavior.'),
  highlightedKpis: z.array(z.string()).describe('KPIs that are likely to be impacted based on the suggested filters and historical user behavior.'),
});
export type PredictiveFilterSuggestionsOutput = z.infer<typeof PredictiveFilterSuggestionsOutputSchema>;

export async function predictiveFilterSuggestions(input: PredictiveFilterSuggestionsInput): Promise<PredictiveFilterSuggestionsOutput> {
  return predictiveFilterSuggestionsFlow(input);
}

const predictiveFilterSuggestionsPrompt = ai.definePrompt({
  name: 'predictiveFilterSuggestionsPrompt',
  input: {schema: PredictiveFilterSuggestionsInputSchema},
  output: {schema: PredictiveFilterSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide filter suggestions and highlight KPIs based on user search input and historical behavior.

  The user is typing "{{searchInput}}" in the filter.
  Available filters are: {{availableFilters}}
  Available KPIs are: {{kpiList}}
  Here's a summary of historical user behavior: {{historicalUserBehavior}}

  Based on the search input and historical user behavior, suggest relevant filters and highlight KPIs that are likely to be impacted. Only suggest filters from available filters.
  Return the response in JSON format.
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
