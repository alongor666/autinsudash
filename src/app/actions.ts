'use server';
import { predictiveFilterSuggestions, PredictiveFilterSuggestionsInput } from '@/ai/flows/predictive-filter-suggestions';
import { availableFiltersForAI, historicalUserBehaviorForAI, kpiListForAI } from '@/lib/data';

export async function getPredictiveSuggestions(searchInput: string) {
    if (!searchInput) {
        return { suggestedFilters: [], highlightedKpis: [] };
    }

    try {
        const input: PredictiveFilterSuggestionsInput = {
            searchInput,
            availableFilters: availableFiltersForAI,
            kpiList: kpiListForAI,
            historicalUserBehavior: historicalUserBehaviorForAI,
        };
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
