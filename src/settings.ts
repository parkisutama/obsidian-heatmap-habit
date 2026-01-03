import { App, PluginSettingTab, Setting } from 'obsidian';
import HeatmapPlugin from './main';
import { AggregationMethod } from './types';

export interface HeatmapHabitSettings {
	valueField: string;
	aggregationMethod: AggregationMethod;
	colorIntensityMin: number;
	colorIntensityMax: number;
}

export const DEFAULT_SETTINGS: HeatmapHabitSettings = {
	valueField: 'value',
	aggregationMethod: 'sum',
	colorIntensityMin: 0,
	colorIntensityMax: 100,
};

export class HeatmapSettingTab extends PluginSettingTab {
	plugin: HeatmapPlugin;

	constructor(app: App, plugin: HeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Heatmap habit settings' });

		new Setting(containerEl)
			.setName('Value field')
			.setDesc('The field name to extract values from (e.g., "value", "score", "duration")')
			.addText(text => text
				.setPlaceholder('value')
				.setValue(this.plugin.settings.valueField)
				.onChange(async (value) => {
					this.plugin.settings.valueField = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshHeatmap();
				}));

		new Setting(containerEl)
			.setName('Aggregation method')
			.setDesc('How to combine multiple entries on the same day')
			.addDropdown(dropdown => dropdown
				.addOption('sum', 'Sum')
				.addOption('average', 'Average')
				.setValue(this.plugin.settings.aggregationMethod)
				.onChange(async (value: AggregationMethod) => {
					this.plugin.settings.aggregationMethod = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshHeatmap();
				}));

		new Setting(containerEl)
			.setName('Color intensity minimum')
			.setDesc('Minimum value for color intensity calculation')
			.addText(text => text
				.setPlaceholder('0')
				.setValue(this.plugin.settings.colorIntensityMin.toString())
				.onChange(async (value) => {
					const num = parseFloat(value);
					if (!isNaN(num)) {
						this.plugin.settings.colorIntensityMin = num;
						await this.plugin.saveSettings();
						await this.plugin.refreshHeatmap();
					}
				}));

		new Setting(containerEl)
			.setName('Color intensity maximum')
			.setDesc('Maximum value for color intensity calculation (0 for auto)')
			.addText(text => text
				.setPlaceholder('100')
				.setValue(this.plugin.settings.colorIntensityMax.toString())
				.onChange(async (value) => {
					const num = parseFloat(value);
					if (!isNaN(num)) {
						this.plugin.settings.colorIntensityMax = num;
						await this.plugin.saveSettings();
						await this.plugin.refreshHeatmap();
					}
				}));
	}
}
