import { App } from 'obsidian';
import { DayData, HeatmapConfig } from '../types';
import HeatmapPlugin from '../main';

export class HeatmapRenderer {
    constructor(
        private app: App,
        private plugin: HeatmapPlugin
    ) { }

    /**
     * Render heatmap based on configuration
     */
    async render(
        container: HTMLElement,
        config: HeatmapConfig,
        dayDataMap: Map<string, DayData>
    ): Promise<void> {
        container.empty();
        container.addClass('heatmap-habit-plugin');

        if (config.type === 'yearly') {
            this.renderYearly(container, dayDataMap);
        } else if (config.type === 'monthly') {
            this.renderMonthly(container, dayDataMap);
        }
    }

    /**
     * Render yearly heatmap (GitHub-style contribution graph)
     */
    private renderYearly(
        container: HTMLElement,
        dayDataMap: Map<string, DayData>
    ): void {
        const now = new Date();
        const year = now.getFullYear();
        const startDate = new Date(year, 0, 1); // Jan 1
        const endDate = new Date(year, 11, 31); // Dec 31

        // Calculate max value for intensity
        const maxValue = Math.max(
            ...Array.from(dayDataMap.values()).map(d => d.aggregatedValue),
            1
        );

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 1. Create Month Header Row
        const monthHeader = container.createDiv({ cls: 'sh-month-header-row' });
        monthHeader.createDiv({ cls: 'sh-month-header-spacer' }); // Spacer for labels

        // 2. Create Body Row (labels + grid)
        const body = container.createDiv({ cls: 'sh-body-row' });

        // 3. Create Day Labels Column
        const dayCol = body.createDiv({ cls: 'sh-day-labels-col' });
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const labelIndices = [0, 2, 4]; // Show Mon, Wed, Fri

        for (let i = 0; i < 7; i++) {
            const labelDiv = dayCol.createDiv({ cls: 'sh-day-label' });
            if (labelIndices.includes(i)) {
                labelDiv.setText(weekDays[i]);
            } else {
                labelDiv.setText('');
            }
        }

        // 4. Create Grid Container
        const grid = body.createDiv({ cls: 'sh-year-grid' });

        // Calculate starting day of week (Monday = 0, Sunday = 6)
        let currentDate = new Date(startDate);
        let dayOfWeek = currentDate.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0

        // 5. Pre-calculate month positions by simulating through the year
        const monthStartWeeks = new Map<number, string>();
        let simCurrent = new Date(startDate);
        let simWeekIndex = 0;
        let simLastMonth = simCurrent.getMonth();

        // Mark January at the first week
        monthStartWeeks.set(0, months[0]);

        // Simulate through all days to find month boundaries
        while (simCurrent <= endDate) {
            const isMonday = simCurrent.getDay() === 1;

            // Start of a new week (Monday)
            if (isMonday && simCurrent.getTime() !== startDate.getTime()) {
                simWeekIndex++;
            }

            // Check if we've entered a new month
            const currentMonth = simCurrent.getMonth();
            if (currentMonth !== simLastMonth) {
                // Mark this week as the start of the new month
                if (!monthStartWeeks.has(simWeekIndex)) {
                    monthStartWeeks.set(simWeekIndex, months[currentMonth]);
                }
                simLastMonth = currentMonth;
            }

            simCurrent.setDate(simCurrent.getDate() + 1);
        }

        // 6. Create month header cells - one cell per week
        for (let w = 0; w <= simWeekIndex; w++) {
            const headerCell = monthHeader.createDiv({ cls: 'sh-month-header-cell' });
            const monthLabel = monthStartWeeks.get(w);
            if (monthLabel) {
                headerCell.setText(monthLabel);
                headerCell.addClass('sh-header-visible');
            }
        }

        // 7. Render the grid
        currentDate = new Date(startDate);
        dayOfWeek = currentDate.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        let currentWeek = grid.createDiv({ cls: 'sh-week-col' });

        // Fill empty cells at the start
        for (let i = 0; i < dayOfWeek; i++) {
            currentWeek.createDiv({ cls: 'sh-day-cell sh-empty' });
        }

        // Render all days
        while (currentDate <= endDate) {
            const isWeekStart = currentDate.getDay() === 1; // Monday

            if (isWeekStart && currentDate.getTime() !== startDate.getTime()) {
                currentWeek = grid.createDiv({ cls: 'sh-week-col' });
            }

            const dateStr = this.formatDate(currentDate);
            const dayData = dayDataMap.get(dateStr);

            const cell = currentWeek.createDiv({ cls: 'sh-day-cell' });
            cell.dataset.date = dateStr;
            cell.setAttribute('aria-label', `${dateStr}: ${dayData?.aggregatedValue || 0}`);

            if (dayData && dayData.aggregatedValue > 0) {
                const intensity = this.calculateIntensity(dayData.aggregatedValue, maxValue);
                this.setStyles(cell, {
                    backgroundColor: 'var(--interactive-accent)',
                    opacity: intensity.toString()
                });
                cell.addClass('has-data');
                // Add hover event
                cell.addEventListener('mouseenter', (e) => {
                    this.showHoverPopup(e.target as HTMLElement, dayData);
                });

                cell.addEventListener('mouseleave', () => {
                    this.removeHoverPopup();
                });

                // Add click event
                cell.addEventListener('click', () => {
                    this.handleCellClick(dayData);
                });
            } else if (dayData && dayData.aggregatedValue === 0) {
                cell.addClass('sh-zero-data');
            } else {
                cell.addClass('sh-empty-data');
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    /**
     * Render monthly heatmap with ISO weeks (minimalist pixel view)
     */
    private renderMonthly(
        container: HTMLElement,
        dayDataMap: Map<string, DayData>
    ): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Get first and last day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Find the Monday of the week containing the first day
        const startDate = new Date(firstDay);
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToMonday);

        // Find the Sunday of the week containing the last day
        const endDate = new Date(lastDay);
        const endDayOfWeek = endDate.getDay();
        const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
        endDate.setDate(endDate.getDate() + daysToSunday);

        // Calculate max value
        const maxValue = Math.max(
            ...Array.from(dayDataMap.values()).map(d => d.aggregatedValue),
            1
        );

        container.addClass('sh-layout-monthly-pixels');

        // Create month card
        const card = container.createDiv({ cls: 'sh-pixel-month-card' });

        // Header with month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const titleRow = card.createDiv({ cls: 'sh-month-title-row' });
        titleRow.createDiv({ cls: 'sh-pixel-month-title' }).setText(monthNames[month]);

        // Day labels row - aligned with grid
        const dayLabelsRow = card.createDiv({ cls: 'sh-month-day-labels-row' });
        dayLabelsRow.createDiv({ cls: 'sh-day-header-spacer' }); // Spacer for week label
        const daysArr = ['M', '', '', '', '', '', 'S']; // Show only M and S
        daysArr.forEach((d) => {
            dayLabelsRow.createDiv({ cls: 'sh-pixel-header' }).setText(d);
        });

        // Create grid with week labels
        const grid = card.createDiv({ cls: 'sh-pixel-grid-numbered' });

        // Render weeks
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Week label
            const weekNum = this.getISOWeek(currentDate);
            const weekLabel = grid.createDiv({ cls: 'sh-week-label' });
            weekLabel.setText(`W${weekNum.toString().padStart(2, '0')}`);

            // Days of the week (Monday to Sunday)
            for (let i = 0; i < 7; i++) {
                const dateStr = this.formatDate(currentDate);
                const dayData = dayDataMap.get(dateStr);
                const isCurrentMonth = currentDate.getMonth() === month;

                const cell = grid.createDiv({ cls: 'sh-day-cell' });
                cell.dataset.date = dateStr;
                cell.setAttribute('aria-label', `${dateStr}: ${dayData?.aggregatedValue || 0}`);

                if (!isCurrentMonth) {
                    // Days from other months - make them less visible
                    cell.addClass('sh-empty-spacer');
                } else if (dayData && dayData.aggregatedValue > 0) {
                    const intensity = this.calculateIntensity(dayData.aggregatedValue, maxValue);
                    this.setStyles(cell, {
                        backgroundColor: 'var(--interactive-accent)',
                        opacity: intensity.toString()
                    });
                    cell.addClass('has-data');
                    // Add hover event
                    cell.addEventListener('mouseenter', (e) => {
                        this.showHoverPopup(e.target as HTMLElement, dayData);
                    });

                    cell.addEventListener('mouseleave', () => {
                        this.removeHoverPopup();
                    });

                    // Add click event
                    cell.addEventListener('click', () => {
                        this.handleCellClick(dayData);
                    });
                } else if (dayData && dayData.aggregatedValue === 0) {
                    cell.addClass('sh-zero-data');
                } else {
                    cell.addClass('sh-empty-data');
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }

    /**
     * Calculate intensity (0-1) based on value and max
     */
    private calculateIntensity(value: number, maxValue: number): number {
        if (maxValue === 0) return 0;
        const normalized = value / maxValue;
        return Math.max(0.15, Math.min(1, normalized));
    }

    /**
     * Get ISO week number
     */
    private getISOWeek(date: Date): number {
        const tempDate = new Date(date.getTime());
        tempDate.setHours(0, 0, 0, 0);
        tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
        const week1 = new Date(tempDate.getFullYear(), 0, 4);
        return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    }

    /**
     * Show hover popup with day details
     */
    private showHoverPopup(cell: HTMLElement, dayData: DayData): void {
        this.removeHoverPopup();

        const popup = document.body.createDiv({ cls: 'heatmap-hover-popup' });

        // Date header
        popup.createEl('div', {
            cls: 'popup-date',
            text: dayData.date
        });

        // Aggregated value
        const valueText = dayData.aggregatedValue.toFixed(2);
        popup.createEl('div', {
            cls: 'popup-value',
            text: `Value: ${valueText}`
        });

        // Entry list
        if (dayData.entries.length > 0) {
            popup.createEl('div', {
                cls: 'popup-count',
                text: `${dayData.entries.length} entr${dayData.entries.length > 1 ? 'ies' : 'y'}`
            });

            const list = popup.createEl('ul', { cls: 'popup-entries' });
            dayData.entries.forEach(entry => {
                const li = list.createEl('li');
                li.createEl('span', {
                    cls: 'entry-name',
                    text: entry.note
                });
                li.createEl('span', {
                    cls: 'entry-value',
                    text: entry.value.toString()
                });
            });
        }

        // Position popup near the cell
        const rect = cell.getBoundingClientRect();
        this.setStyles(popup, {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.bottom + 5}px`,
            zIndex: '1000'
        });

        // Store reference for cleanup with proper typing
        interface ElementWithPopup extends HTMLElement {
            _heatmapPopup?: HTMLElement;
        }
        (cell as ElementWithPopup)._heatmapPopup = popup;
    }

    /**
     * Remove hover popup
     */
    private removeHoverPopup(): void {
        document.querySelectorAll('.heatmap-hover-popup').forEach(popup => popup.remove());
    }

    /**
     * Handle cell click - open search with filtered results
     */
    private handleCellClick(dayData: DayData): void {
        // Execute search for all habit notes on this date
        const searchQuery = dayData.entries
            .map(e => `path:"${e.filePath}"`)
            .join(' OR ');

        // Find existing search leaf or get a leaf in the right sidebar
        const { workspace } = this.app;
        let searchLeaf = workspace.getLeavesOfType('search')[0];

        if (!searchLeaf) {
            // No search view exists, create one in right sidebar
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                searchLeaf = rightLeaf;
            } else {
                // Fallback: split current leaf
                searchLeaf = workspace.getLeaf('split', 'vertical');
            }
        }

        // Set or update the search view state
        void searchLeaf.setViewState({
            type: 'search',
            state: {
                query: searchQuery,
                matchingCase: false,
                explainSearch: false
            }
        });

        // Reveal the search leaf
        void workspace.revealLeaf(searchLeaf);
    }

    /**
     * Format date as YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Helper to set multiple CSS properties on an element
     * Uses setAttr to comply with Obsidian linting rules
     */
    private setStyles(element: HTMLElement, styles: Record<string, string>): void {
        for (const [key, value] of Object.entries(styles)) {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            element.style.setProperty(cssKey, value);
        }
    }
}

