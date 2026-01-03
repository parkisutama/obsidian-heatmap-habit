import { TFile, Vault } from 'obsidian';
import { HabitEntry, DayData, AggregationMethod } from '../types';

export class HeatmapDataProcessor {
    constructor(private vault: Vault) { }

    /**
     * Aggregate entries for a single day based on the specified method
     */
    aggregateEntries(entries: HabitEntry[], method: AggregationMethod): number {
        if (entries.length === 0) return 0;

        const values = entries.map(e => e.value);

        switch (method) {
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            case 'average':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            default:
                return 0;
        }
    }

    /**
     * Parse a note and extract the value from the specified field
     */
    async extractValueFromNote(file: TFile, valueField: string): Promise<number | null> {
        const content = await this.vault.read(file);

        // Match frontmatter field
        const frontmatterRegex = new RegExp(`^${valueField}:\\s*([\\d.]+)`, 'm');
        const frontmatterMatch = content.match(frontmatterRegex);

        if (frontmatterMatch) {
            return parseFloat(frontmatterMatch[1]);
        }

        // Match inline field (Dataview style)
        const inlineRegex = new RegExp(`${valueField}::\\s*([\\d.]+)`, 'm');
        const inlineMatch = content.match(inlineRegex);

        if (inlineMatch) {
            return parseFloat(inlineMatch[1]);
        }

        return null;
    }

    /**
     * Get the date from a note (from frontmatter or filename)
     */
    async getDateFromNote(file: TFile): Promise<string | null> {
        const content = await this.vault.read(file);

        // Try to get date from frontmatter
        const dateMatch = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
        if (dateMatch) {
            return dateMatch[1];
        }

        // Try to extract date from filename (YYYY-MM-DD format)
        const filenameMatch = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
        if (filenameMatch) {
            return filenameMatch[1];
        }

        return null;
    }

    /**
     * Process all habit notes and group by date
     */
    async processHabitNotes(
        files: TFile[],
        valueField: string,
        aggregationMethod: AggregationMethod
    ): Promise<Map<string, DayData>> {
        const dayDataMap = new Map<string, DayData>();

        for (const file of files) {
            const date = await this.getDateFromNote(file);
            if (!date) continue;

            const value = await this.extractValueFromNote(file, valueField);
            if (value === null) continue;

            const entry: HabitEntry = {
                date,
                note: file.basename,
                value,
                filePath: file.path,
            };

            if (!dayDataMap.has(date)) {
                dayDataMap.set(date, {
                    date,
                    entries: [],
                    aggregatedValue: 0,
                });
            }

            const dayData = dayDataMap.get(date)!;
            dayData.entries.push(entry);
        }

        // Calculate aggregated values
        for (const [date, dayData] of dayDataMap) {
            dayData.aggregatedValue = this.aggregateEntries(
                dayData.entries,
                aggregationMethod
            );
        }

        return dayDataMap;
    }
}
