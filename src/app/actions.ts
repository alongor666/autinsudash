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
        return result;
    } catch (error) {
        console.error("Error getting predictive suggestions:", error);
        return { suggestedFilters: [], highlightedKpis: [] };
    }
}
