export interface HabitEntry {
    date: string;
    note: string;
    value: number;
    filePath: string;
}

export interface DayData {
    date: string;
    entries: HabitEntry[];
    aggregatedValue: number;
}

export type AggregationMethod = 'sum' | 'average';
export type HeatmapType = 'yearly' | 'monthly';

export interface HeatmapConfig {
    type: HeatmapType;
    search_path?: string;
    date_field: string;
    value_field: string;
    aggregation?: AggregationMethod;
}

export interface HeatmapSettings {
    valueField: string;
    aggregationMethod: AggregationMethod;
    colorIntensityMin: number;
    colorIntensityMax: number;
}
