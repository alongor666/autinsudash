'use server';
import { predictiveFilterSuggestions, PredictiveFilterSuggestionsInput, PredictiveFilterSuggestionsOutput } from '@/ai/flows/predictive-filter-suggestions';

export async function getPredictiveSuggestions(input: PredictiveFilterSuggestionsInput): Promise<PredictiveFilterSuggestionsOutput> {
    if (!input.searchInput) {
        return { suggestedFilters: [], highlightedKpis: [] };
    }

    try {
        const result = await predictiveFilterSuggestions(input);
        return {
          suggestedFilters: result.suggestedFilters || [],
          highlightedKpis: result.highlightedKpis || []
        };
    } catch (error) {
        console.error("Error getting predictive suggestions:", error);
        // In case of an error, return empty arrays to avoid breaking the UI.
        return { suggestedFilters: [], highlightedKpis: [] };
    }
}
