# Figmation

A Node.js package that generates CSS custom properties (variables) from Figma local variables.

## Features

- 🎨 Converts Figma local variables to CSS custom properties
- 🔄 Maintains variable scopes and types
- 📁 Supports variable grouping
- 🎯 Customizable output paths and filenames
- 🚫 Respects "hide from publishing" settings
- 🎭 Consistent prefix naming based on variable types

## Installation

```bash
npm install figmation
```

## Usage

### Basic Usage

```ts
import { Figmation } from 'figmation';

const figmation = new Figmation({
  figmaAccessToken: 'your-figma-access-token',
  figmaFileId: 'your-figma-file-id',
  outputPath: './styles',
  filename: 'variables.css'
});
// Generate CSS variables
await figmation.generateFromFigma();
```

### With Options

```ts
await figmation.generateFromFigma({
  grouping: true, // Group variables by their path
  addFileInfo: true, // Add Figma file information as comments
  groupComment: true, // Add group comments in the output
});
```

### Working with Figma Variable Modes

Figmation automatically detects and converts Figma variable modes. Each mode will be generated as a separate CSS file.

```ts
const figmation = new Figmation({
  figmaAccessToken: 'your-token',
  figmaFileId: 'your-file-id'
});

// Generate CSS for default mode
await figmation.generateFromFigma();

// Generate CSS for a specific mode
await figmation.generateFromFigma({ mode: 'dark' });

// The generated files will be:
// - variables.default.css
// - variables.dark.css
```

When your Figma variables have multiple modes (like "Default" and "Dark"), each mode's values will be preserved in the corresponding CSS file.

## Output Example

```css
/* Generated from Figma file: Design System
Last modified: 2024-02-20T10:00:00.000Z
Generated on: 2024-02-20T10:30:00.000Z
*/
/* Colors */
:root {
--color-primary: #FF0000;
--color-secondary: #00FF00;
--color-text: #333333;
}
/* Typography */
:root {
--font-family-primary: 'Inter';
--font-size-body: 16px;
--font-weight-normal: 400;
--line-height-default: 1.5;
}
/* Layout */
:root {
--border-radius-small: 4px;
--gap-section: 24px;
}
```

## Configuration

### FigmationConfig

```ts
interface FigmationConfig {
  outputPath?: string; // Output directory path (default: './')
  filename?: string; // Output filename (default: 'variables.css')
  figmaAccessToken?: string;// Your Figma access token
  figmaFileId?: string; // Your Figma file ID
}
```

### Variable Scopes

The package supports all Figma variable scopes and automatically applies appropriate prefixes:

- Colors (`--color-*`)
  - ALL_FILLS
  - FRAME_FILL
  - SHAPE_FILL
  - TEXT_FILL
  - STROKE_COLOR
  - EFFECT_COLOR
- Typography
  - FONT_FAMILY (`--font-family-*`)
  - FONT_STYLE (`--font-style-*`)
  - FONT_WEIGHT (`--font-weight-*`)
  - FONT_SIZE (`--font-size-*`)
  - LINE_HEIGHT (`--line-height-*`)
  - LETTER_SPACING (`--letter-spacing-*`)
- Layout
  - CORNER_RADIUS (`--border-radius-*`)
  - WIDTH_HEIGHT (`--size-*`)
  - GAP (`--gap-*`)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Requirements

- Node.js >= 22.12.0
- npm >= 10.9.0

## License

MIT

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -am 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a new Pull Request
