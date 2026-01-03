import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { HeatmapHabitSettings, DEFAULT_SETTINGS, HeatmapSettingTab } from './settings';
import { HeatmapDataProcessor } from './utils/heatmapProcessor';
import { HeatmapRenderer } from './ui/heatmapRenderer';
import { HeatmapConfig } from './types';

export default class HeatmapPlugin extends Plugin {
	settings: HeatmapHabitSettings;
	private dataProcessor: HeatmapDataProcessor;
	private renderer: HeatmapRenderer;

	async onload() {
		await this.loadSettings();

		this.dataProcessor = new HeatmapDataProcessor(this.app.vault);
		this.renderer = new HeatmapRenderer(this.app, this);

		// Register markdown code block processor
		this.registerMarkdownCodeBlockProcessor(
			'heatmap-habit',
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				await this.processHeatmapCodeBlock(source, el, ctx);
			}
		);

		// Add settings tab
		this.addSettingTab(new HeatmapSettingTab(this.app, this));
	}

	async onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getDataProcessor(): HeatmapDataProcessor {
		return this.dataProcessor;
	}

	/**
	 * Process heatmap code block
	 */
	private async processHeatmapCodeBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): Promise<void> {
		try {
			// Parse configuration from code block
			const config = this.parseConfig(source);

			// Get files based on search path
			let files = this.app.vault.getMarkdownFiles();
			if (config.search_path) {
				files = files.filter(f => f.path.includes(config.search_path!));
			}

			// Process habit notes
			const aggregation = config.aggregation || this.settings.aggregationMethod;
			const dayDataMap = await this.dataProcessor.processHabitNotes(
				files,
				config.value_field,
				aggregation
			);

			// Render heatmap
			await this.renderer.render(el, config, dayDataMap);

		} catch (error) {
			el.createDiv({
				cls: 'heatmap-error',
				text: `Error rendering heatmap: ${error.message}`
			});
			console.error('Heatmap rendering error:', error);
		}
	}

	/**
	 * Parse configuration from code block content
	 */
	private parseConfig(source: string): HeatmapConfig {
		const lines = source.trim().split('\n');
		const config: any = {
			type: 'yearly',
			date_field: 'date',
			value_field: 'value'
		};

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			const colonIndex = trimmed.indexOf(':');
			if (colonIndex === -1) continue;

			const key = trimmed.substring(0, colonIndex).trim();
			let value = trimmed.substring(colonIndex + 1).trim();

			// Remove quotes
			if ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}

			config[key] = value;
		}

		return config as HeatmapConfig;
	}
}
