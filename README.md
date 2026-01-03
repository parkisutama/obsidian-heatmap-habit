# Obsidian Heatmap Habit Plugin

A visual habit tracking plugin for Obsidian that displays your habit data in interactive heatmaps directly in your notes using code blocks.

## Features

### 📊 Two Display Modes

**Yearly Heatmap** - GitHub-style contribution graph

- Shows 365 days of habit data
- Adapts to Obsidian theme colors
- Week starts on Monday (ISO week format)
- Perfect for year-long habit tracking overview

**Monthly Heatmap** - Calendar view with ISO weeks

- Shows current month with week numbers
- Displays day numbers for easy reference
- Week starts on Monday
- Great for detailed monthly habit analysis

### 🎨 Visual Intensity

- Heatmap cells show color intensity based on aggregated values
- Configurable aggregation: sum or average for multiple entries on the same day
- Automatically adapts to your Obsidian theme (light/dark)

### 🔍 Hover Popup Details

When hovering over any heatmap cell, you'll see:

- Date
- Aggregated value
- Number of habit entries for that day
- List of individual habit entries with their values

### 🔎 Click to Search

Click on any heatmap cell to:

- Open Obsidian's search sidebar
- Automatically filter to show all habit notes for that specific day
- Easily navigate to and review your habit entries

## Usage

### Basic Syntax

Add a heatmap to any note using a code block:

````markdown
```heatmap-habit
type: yearly
search_path: "habit/exercise"
date_field: date
value_field: duration_min
aggregation: sum
```
````

### Configuration Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `type` | No | `yearly` | Display type: `yearly` or `monthly` |
| `search_path` | No | (all files) | Filter notes by path (e.g., `"habit/cycling"`) |
| `date_field` | Yes | `date` | Field name containing the date |
| `value_field` | Yes | `value` | Field name containing the numeric value |
| `aggregation` | No | (from settings) | Aggregation method: `sum` or `average` |

### Examples

**Yearly exercise tracking:**

````markdown
```heatmap-habit
type: yearly
search_path: "habit/go-cycling"
date_field: date
value_field: duration_min
```
````

**Monthly meditation minutes:**

````markdown
```heatmap-habit
type: monthly
search_path: "habits/meditation"
date_field: date
value_field: minutes
aggregation: sum
```
````

**All habits (no path filter):**

````markdown
```heatmap-habit
type: yearly
date_field: date
value_field: score
```
````

## Setup

### Data Format

Your habit notes should include a date and a value field. The plugin supports:

**Frontmatter format:**

```yaml
---
date: 2026-01-03
value: 5
---
```

**Dataview inline format:**

```
value:: 5
```

**Date from filename:**

- Format: `YYYY-MM-DD` anywhere in the filename
- Example: `2026-01-03-workout.md`

### Settings

Configure the plugin in **Settings → Heatmap Habit**:

1. **Value field**: The field name to extract values from (e.g., "value", "score", "duration")
2. **Aggregation method**: How to combine multiple entries on the same day (sum or average)
3. **Color intensity minimum**: Minimum value for color intensity calculation
4. **Color intensity maximum**: Maximum value for color intensity calculation (0 for auto)

### Interacting with the Heatmap

1. **View intensity**: Darker/brighter cells indicate higher values
2. **Hover for details**: Move your mouse over any cell to see the popup with detailed information
3. **Click to explore**: Click a cell to open the search sidebar and see all notes for that day

## Development

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: <https://github.com/obsidianmd/obsidian-sample-plugin/releases>
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at <https://github.com/obsidianmd/obsidian-releases> to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- This project already has eslint preconfigured, you can invoke a check by running`npm run lint`
- Together with a custom eslint [plugin](https://github.com/obsidianmd/eslint-plugin) for Obsidan specific code guidelines.
- A GitHub action is preconfigured to automatically lint every commit on all branches.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See <https://docs.obsidian.md>
