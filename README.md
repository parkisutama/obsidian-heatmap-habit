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
| ------ | -------- | ------- | ----------- |
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
