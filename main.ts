import { Plugin, MarkdownPostProcessorContext, parseYaml, TFile } from 'obsidian';

interface HeatmapConfig {
    type: 'yearly' | 'monthly';
    search_path: string;
    date_field: string;
    value_field: string | string[];
    default_value?: number;
    week_start_day?: 'monday' | 'sunday';
}

interface HeatmapData {
    date: string;
    value: number;
    file: TFile;
}

export default class HeatmapHabitPlugin extends Plugin {

    async onload() {
        this.registerMarkdownCodeBlockProcessor("heatmap-habit", this.processHeatmap.bind(this));
    }

    async processHeatmap(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        let config: HeatmapConfig;
        try {
            config = parseYaml(source);
        } catch (e) {
            this.renderError(el, "Invalid YAML.");
            return;
        }

        const files = this.app.vault.getMarkdownFiles();
        const dataset: HeatmapData[] = [];
        let maxValue = 0;

        // 1. Data Fetching
        const relevantFiles = files.filter(f => {
            if (config.search_path.startsWith("#")) {
                const cache = this.app.metadataCache.getFileCache(f);
                return cache?.tags?.some(t => t.tag.startsWith(config.search_path));
            } else {
                return f.path.startsWith(config.search_path);
            }
        });

        for (const file of relevantFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;

            let dateStr = "";
            if (config.date_field === 'file.ctime') {
                dateStr = window.moment(file.stat.ctime).format('YYYY-MM-DD');
            } else if (config.date_field === 'file.name') {
                const name = file.basename;
                const dateMatch = name.match(/(\d{4}-\d{2}-\d{2})/);
                dateStr = dateMatch ? dateMatch[0] : "";
            } else if (frontmatter && frontmatter[config.date_field]) {
                const d = window.moment(frontmatter[config.date_field]);
                if (d.isValid()) dateStr = d.format('YYYY-MM-DD');
            }

            let value = 0;
            const fieldsToCheck = Array.isArray(config.value_field) ? config.value_field : [config.value_field];

            if (frontmatter) {
                for (const field of fieldsToCheck) {
                    if (frontmatter[field] !== undefined) {
                        const raw = frontmatter[field];
                        if (typeof raw === 'number') {
                            value = raw;
                            if (value > 0) break;
                        } else if (typeof raw === 'boolean' && raw === true) {
                            value = 1; break;
                        }
                    }
                }
            }
            if (value === 0 && config.default_value !== undefined) value = config.default_value;

            if (dateStr) {
                dataset.push({ date: dateStr, value, file });
                if (value > maxValue) maxValue = value;
            }
        }

        el.empty();
        el.addClass('heatmap-habit-plugin');

        const startMonday = config.week_start_day === 'monday';

        if (config.type === 'monthly') {
            this.renderMonthly(el, dataset, maxValue, startMonday);
        } else {
            this.renderYearly(el, dataset, maxValue, startMonday);
        }
    }

    // --- YEARLY VIEW ---
    renderYearly(el: HTMLElement, data: HeatmapData[], maxValue: number, startMonday: boolean) {
        const year = new Date().getFullYear();
        const dataMap = new Map(data.map(d => [d.date, d]));
        const startDate = window.moment(`${year}-01-01`);
        const endDate = window.moment(`${year}-12-31`);

        // Layout Containers
        const monthHeader = el.createDiv({ cls: 'sh-month-header-row' });
        // The spacer needs to match the width of the label column EXACTLY
        // CSS: width 24px + margin-right 4px = 28px
        monthHeader.createDiv({ cls: 'sh-month-header-spacer' });

        const body = el.createDiv({ cls: 'sh-body-row' });

        // 1. LABELS (Dynamic)
        const dayCol = body.createDiv({ cls: 'sh-day-labels-col' });
        const weekDays = startMonday
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const targetIndices = [1, 3, 5]; // Mon, Wed, Fri (Visual Rows 1, 3, 5) if 0-indexed

        // Actually, let's stick to your requested 1st, 4th, 7th (Indices 0, 3, 6)
        // Mon (0), Thu (3), Sun (6)
        const labelIndices = [0, 3, 6];

        for (let i = 0; i < 7; i++) {
            const labelDiv = dayCol.createDiv({ cls: 'sh-day-label' });
            if (labelIndices.includes(i)) labelDiv.setText(weekDays[i]);
            else labelDiv.setText("");
        }

        // 2. GRID
        const grid = body.createDiv({ cls: 'sh-year-grid' });

        // Month Labels Container - We will NOT add labels inside the loop blindly.
        // Instead, we track week indices.

        let current = startDate.clone();

        // Calculate padding
        let dayOfWeek = current.day();
        if (startMonday) dayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;

        let currentWeek = grid.createDiv({ cls: 'sh-week-col' });

        for (let i = 0; i < dayOfWeek; i++) {
            currentWeek.createDiv({ cls: 'sh-day-cell sh-empty' });
        }

        let lastLabelMonth = -1;
        let weekIndex = 0; // Track which column we are in

        // We need to place labels into the header relative to week position.
        // However, HTML doesn't let us place "Week 5 text" over "Week 5 div" easily if they are in different parents.
        // TRICK: We will insert empty spacers into the header matching the week widths.

        // Initial Padding Spacer in Header if needed? 
        // No, the month header is just a flex row. We need to add "Month Name" or "Spacer" for every week.

        // ACTUALLY BETTER STRATEGY: 
        // We will generate the header items PARALLEL to the week columns.

        // But first, let's finish the Grid Loop logic, then we solve the Header.

        // To do this strictly, we need to know exactly when a week starts a new month.
        // Let's modify the loop to handle both Grid and Header.

        // Reset for the big loop
        current = startDate.clone();

        // We need a list of "Month Start Weeks".
        const monthStartWeeks = new Map<number, string>(); // WeekIndex -> MonthName

        // We simulate the weeks to find where months start
        let simCurrent = startDate.clone();
        let simWeekIndex = 0;
        let simLastMonth = -1;

        // Check first week manually
        monthStartWeeks.set(0, simCurrent.format('MMM'));
        simLastMonth = simCurrent.month();

        while (simCurrent.isBefore(endDate)) {
            const isWeekStart = startMonday ? simCurrent.day() === 1 : simCurrent.day() === 0;
            if (isWeekStart && !simCurrent.isSame(startDate, 'day')) {
                simWeekIndex++;

                // Logic: Does this week contain the 1st of a month?
                const weekEnd = simCurrent.clone().add(6, 'days');
                let foundNewMonth = -1;

                // If the 1st is in this week
                if (simCurrent.date() === 1) foundNewMonth = simCurrent.month();
                else if (weekEnd.date() <= 7 && weekEnd.month() !== simCurrent.month()) {
                    // The 1st is somewhere in this week
                    foundNewMonth = weekEnd.month();
                }

                // FIX: Prevent Duplicate Jan (Month 0) if we are in Dec (Month 11)
                // Only update if foundNewMonth > simLastMonth (handles Jan->Feb) 
                // OR if we strictly wrapped year (but we stop at Dec 31, so no wrapping)
                if (foundNewMonth !== -1 && foundNewMonth !== simLastMonth && foundNewMonth > simLastMonth) {
                    monthStartWeeks.set(simWeekIndex, window.moment().month(foundNewMonth).format('MMM'));
                    simLastMonth = foundNewMonth;
                }
            }
            simCurrent.add(1, 'day');
        }

        // NOW RENDER HEADER BASED ON MAP
        // We assume 53 weeks max.
        for (let w = 0; w <= simWeekIndex; w++) {
            const headerCell = monthHeader.createDiv({ cls: 'sh-month-header-cell' });
            if (monthStartWeeks.has(w)) {
                headerCell.setText(monthStartWeeks.get(w)!);
                headerCell.addClass('sh-header-visible');
            }
        }

        // RENDER GRID (Standard)
        current = startDate.clone();
        // Reset padding for render
        currentWeek = grid.createDiv({ cls: 'sh-week-col' });
        for (let i = 0; i < dayOfWeek; i++) currentWeek.createDiv({ cls: 'sh-day-cell sh-empty' });

        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            const isWeekStart = startMonday ? current.day() === 1 : current.day() === 0;
            if (isWeekStart && !current.isSame(startDate, 'day')) {
                currentWeek = grid.createDiv({ cls: 'sh-week-col' });
            }

            const dateStr = current.format('YYYY-MM-DD');
            const entry = dataMap.get(dateStr);
            const value = entry ? entry.value : null;

            const cell = currentWeek.createDiv({ cls: 'sh-day-cell' });
            cell.setAttribute('aria-label', `${dateStr}: ${value || 0}`);

            if (value !== null) {
                if (value === 0) cell.addClass('sh-zero-data');
                else this.applyColor(cell, value, maxValue);
                cell.addEventListener('click', () => { if (entry) this.app.workspace.getLeaf().openFile(entry.file); });
            } else {
                cell.addClass('sh-empty-data');
            }
            current.add(1, 'day');
        }
    }

    // --- MONTHLY VIEW (With Week Labels) ---
    renderMonthly(el: HTMLElement, data: HeatmapData[], maxValue: number, startMonday: boolean) {
        el.addClass('sh-layout-monthly-pixels');

        const months = new Map<string, HeatmapData[]>();
        data.forEach(d => {
            const key = d.date.substring(0, 7);
            if (!months.has(key)) months.set(key, []);
            months.get(key)?.push(d);
        });

        const sortedKeys = Array.from(months.keys()).sort();

        sortedKeys.forEach(key => {
            const monthData = months.get(key) || [];
            const monthDate = window.moment(`${key}-01`);

            const card = el.createDiv({ cls: 'sh-pixel-month-card' });

            // 1. Header Row (Month Name + Day Labels)
            const headerRow = card.createDiv({ cls: 'sh-month-header-flex' });
            headerRow.createDiv({ cls: 'sh-pixel-month-title' }).setText(monthDate.format('MMMM'));

            // Day Labels: First and Last only (e.g., M ...... S)
            const dayLabelsDiv = headerRow.createDiv({ cls: 'sh-month-day-labels' });
            // Add spacer for Week Column
            dayLabelsDiv.createDiv({ cls: 'sh-day-header-spacer' });

            const daysArr = startMonday ? ['M', '', '', '', '', '', 'S'] : ['S', '', '', '', '', '', 'S'];
            daysArr.forEach(d => {
                dayLabelsDiv.createDiv({ cls: 'sh-pixel-header' }).setText(d);
            });

            // 2. The Grid (8 Columns: 1 WeekNum + 7 Days)
            const grid = card.createDiv({ cls: 'sh-pixel-grid-numbered' });

            const daysInMonth = monthDate.daysInMonth();
            const dataMap = new Map(monthData.map(d => [d.date, d]));

            // Calculate Padding
            let emptyCount = monthDate.day(); // Sun=0
            if (startMonday) emptyCount = (emptyCount === 0) ? 6 : emptyCount - 1;

            // Total cells needed = padding + days
            const totalCells = emptyCount + daysInMonth;
            const rows = Math.ceil(totalCells / 7);

            // Loop through Rows
            for (let r = 0; r < rows; r++) {
                // A. Render Week Label (Left Side)
                // Calculate the date of the first day in this visual row (could be padding)
                // We determine the "Monday" of that week to get the ISO number
                const firstDayOfRowIndex = (r * 7) - emptyCount + 1;
                const dateOfRowStart = monthDate.clone().date(firstDayOfRowIndex);

                const weekLabel = grid.createDiv({ cls: 'sh-week-label' });
                // If it's pure ISO, use isoWeek(). Note: This might mismatch if visual is Sunday-start
                weekLabel.setText(`W${dateOfRowStart.isoWeek().toString().padStart(2, '0')}`);

                // B. Render 7 Days
                for (let c = 0; c < 7; c++) {
                    const dayIndex = (r * 7) + c - emptyCount + 1;

                    if (dayIndex > 0 && dayIndex <= daysInMonth) {
                        const dateStr = monthDate.clone().date(dayIndex).format('YYYY-MM-DD');
                        const entry = dataMap.get(dateStr);
                        const value = entry ? entry.value : null;

                        const cell = grid.createDiv({ cls: 'sh-day-cell' });
                        cell.setAttribute('aria-label', `${dateStr}: ${value || 0}`);
                        if (value !== null) {
                            if (value === 0) cell.addClass('sh-zero-data');
                            else this.applyColor(cell, value, maxValue);
                            cell.addEventListener('click', () => { if (entry) this.app.workspace.getLeaf().openFile(entry.file); });
                        }
                    } else {
                        grid.createDiv({ cls: 'sh-day-cell sh-empty-spacer' });
                    }
                }
            }
        });
    }

    applyColor(cell: HTMLElement, value: number, max: number) {
        const safeMax = max > 0 ? max : 1;
        const intensity = Math.max(0.2, Math.min(1, value / safeMax));
        cell.style.backgroundColor = "var(--interactive-accent)";
        cell.style.opacity = `${intensity}`;
    }

    renderError(el: HTMLElement, msg: string) {
        el.createDiv({ cls: 'sh-error' }).setText(msg);
    }
}