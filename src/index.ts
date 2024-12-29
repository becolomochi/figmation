import { writeFileSync } from 'fs';
import { join } from 'path';
import { FigmaClient } from './figma-client';
import {
  Variable,
  VariableScope,
  FigmaVariable,
  VariableGroup,
  CSSGenerationOptions,
  VARIABLE_SCOPES,
} from './types';
import { DEFAULT_SCOPE_PREFIXES } from './constants';

interface FigmationConfig {
  outputPath?: string;
  filename?: string;
  figmaAccessToken?: string;
  figmaFileId?: string;
}

export class Figmation {
  private config: FigmationConfig;
  private figmaClient?: FigmaClient;

  constructor(config: FigmationConfig = {}) {
    this.config = {
      outputPath: './',
      filename: 'variables.css',
      ...config,
    };

    if (this.config.figmaAccessToken && this.config.figmaFileId) {
      this.figmaClient = new FigmaClient(this.config.figmaAccessToken, this.config.figmaFileId);
    }
  }

  private formatVariableName(name: string, scope: VariableScope): string {
    // Get the prefix for this scope
    const prefix = DEFAULT_SCOPE_PREFIXES[scope];

    // Remove the top-level category (e.g., "Typography", "Colors") from the path
    const parts = name.split('/');
    // If the path includes "Size", remove it as it's redundant with font-size prefix
    const relevantParts = parts.filter((part) => part.toLowerCase() !== 'size').slice(1);

    const nameWithoutCategory =
      relevantParts.length > 0 ? relevantParts.join('-') : parts[parts.length - 1];

    // Convert to lowercase and clean up the name
    const formattedName = nameWithoutCategory
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\//g, '-');

    // Add the scope-based prefix
    return `--${prefix}-${formattedName}`;
  }

  private formatVariableValue(value: any, scope: VariableScope): string {
    const stringValue = value.toString();

    switch (scope) {
      case 'FONT_SIZE':
      case 'LINE_HEIGHT':
      case 'LETTER_SPACING':
      case 'PARAGRAPH_SPACING':
      case 'PARAGRAPH_INDENT':
      case 'CORNER_RADIUS':
      case 'GAP':
        return `${stringValue}px`;
      case 'OPACITY':
        return stringValue;
      default:
        return stringValue;
    }
  }

  private getVariableCategory(name: string, scope: VariableScope): string {
    // First try to determine category from the path
    const parts = name.split('/');
    if (parts.length > 1) {
      return parts[0];
    }

    // If no path, determine from scope
    switch (scope) {
      case 'ALL_FILLS':
      case 'FRAME_FILL':
      case 'SHAPE_FILL':
      case 'TEXT_FILL':
      case 'STROKE_COLOR':
      case 'EFFECT_COLOR':
        return 'Colors';
      case 'FONT_SIZE':
      case 'FONT_FAMILY':
      case 'FONT_WEIGHT':
      case 'LINE_HEIGHT':
      case 'LETTER_SPACING':
      case 'PARAGRAPH_SPACING':
      case 'PARAGRAPH_INDENT':
        return 'Typography';
      case 'CORNER_RADIUS':
      case 'WIDTH_HEIGHT':
      case 'GAP':
        return 'Layout';
      default:
        return 'Other';
    }
  }

  private groupVariables(variables: Variable[]): VariableGroup[] {
    const groups: { [key: string]: Variable[] } = {};

    variables.forEach((variable) => {
      const category = this.getVariableCategory(variable.name, variable.scope);

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(variable);
    });

    // Sort groups by category name
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, vars]) => ({
        name,
        variables: vars,
      }));
  }

  private generateGroupedCSS(groups: VariableGroup[]): string {
    return groups
      .map((group) => {
        const groupVars = this.generateCSS(group.variables, false);
        return `/* ${group.name} */\n${groupVars}`;
      })
      .join('\n\n');
  }

  public generateCSS(variables: Variable[], wrapInRoot: boolean = true): string {
    let css = '';
    const groups = this.groupVariables(variables);

    groups.forEach((group) => {
      css += `/* ${group.name} */\n`;
      group.variables.forEach((variable) => {
        if (!variable.hidden) {
          const name = this.formatVariableName(variable.name, variable.scope);
          const value = this.formatVariableValue(variable.value, variable.scope);
          css += `  ${name}: ${value};\n`;
        }
      });
      css += '\n';
    });

    return wrapInRoot ? `:root {\n${css}}` : css;
  }

  public async writeCSS(variables: Variable[], options: CSSGenerationOptions = {}): Promise<void> {
    try {
      const css = this.generateCSS(variables);
      const filePath = join(this.config.outputPath!, this.config.filename!);
      writeFileSync(filePath, css);
      console.log(`✨ CSS variables file generated successfully at: ${filePath}`);
    } catch (error) {
      console.error('❌ Error writing CSS file:', error);
      throw error;
    }
  }

  private async getFigmaVariables(): Promise<FigmaVariable[]> {
    if (!this.figmaClient) {
      throw new Error('Figma client is not initialized');
    }
    return await this.figmaClient.getLocalVariables();
  }

  private getDefaultScope(scopes: string[]): VariableScope {
    const scope = scopes[0];
    if (this.isValidScope(scope)) {
      return scope;
    }
    return 'ALL_FILLS';
  }

  private isValidScope(scope: string): scope is VariableScope {
    return VARIABLE_SCOPES.includes(scope as VariableScope);
  }

  private convertFigmaVariables(figmaVariables: FigmaVariable[]): Variable[] {
    return figmaVariables.map((figmaVar) => {
      const scope = this.getDefaultScope(figmaVar.scopes);
      return {
        id: figmaVar.id,
        name: figmaVar.name,
        value: figmaVar.valuesByMode[Object.keys(figmaVar.valuesByMode)[0]] || figmaVar.value,
        scope,
        hidden: figmaVar.hiddenFromPublishing || false,
      };
    });
  }

  public async generateFromFigma(options: CSSGenerationOptions = {}): Promise<void> {
    if (!this.config.figmaAccessToken || !this.config.figmaFileId) {
      throw new Error('Figma access token and file ID are required');
    }

    if (!this.figmaClient) {
      this.figmaClient = new FigmaClient(this.config.figmaAccessToken, this.config.figmaFileId);
    }

    try {
      const figmaVariables = await this.figmaClient.getLocalVariables();
      const variables = this.convertFigmaVariables(figmaVariables);
      await this.writeCSS(variables, options);
    } catch (error) {
      console.error('❌ Error fetching variables from Figma:', error);
      throw error;
    }
  }

  private transformFigmaVariable(figmaVar: FigmaVariable): Variable {
    const scope = this.isValidScope(figmaVar.scopes[0]) ? figmaVar.scopes[0] : 'ALL_FILLS';

    return {
      id: figmaVar.id,
      name: figmaVar.name,
      value: figmaVar.value,
      scope,
      hidden: figmaVar.hiddenFromPublishing,
    };
  }
}
