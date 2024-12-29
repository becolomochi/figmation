import { Figmation } from '../index';
import { Variable, VariableScope } from '../types';
import { mkdirSync, rmSync } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import { FigmaVariable } from '../types';

describe('Figmation', () => {
  let figmation: Figmation;

  beforeEach(() => {
    figmation = new Figmation({
      figmaAccessToken: 'mock-token',
      figmaFileId: 'mock-file-id',
      outputPath: './test-output',
      filename: 'test-variables.css',
    });
  });

  afterAll(() => {
    // Clean up any generated files in root directory
    const defaultFile = 'variables.default.css';
    if (existsSync(defaultFile)) {
      rmSync(defaultFile);
    }
  });

  describe('generateCSS', () => {
    test('should generate CSS with grouping', () => {
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Primary',
          value: '#FF0000',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: false,
        },
        {
          id: '2',
          name: 'Large',
          value: '24',
          scope: 'FONT_SIZE' as VariableScope,
          hidden: false,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      const lines = css.split('\n');

      expect(lines).toContain('  --color-primary: #FF0000;');
      expect(lines).toContain('  --font-size-large: 24px;');
      expect(css).toContain('/* Colors */');
      expect(css).toContain('/* Typography */');

      const colorIndex = css.indexOf('/* Colors */');
      const typographyIndex = css.indexOf('/* Typography */');
      expect(colorIndex).toBeLessThan(typographyIndex);
    });

    test('should handle variables without explicit categories', () => {
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Accent',
          value: '#00FF00',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: false,
        },
        {
          id: '2',
          name: 'Small',
          value: '4',
          scope: 'CORNER_RADIUS' as VariableScope,
          hidden: false,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      expect(css).toContain('/* Colors */');
      expect(css).toContain('/* Layout */');
      expect(css).toContain('--color-accent: #00FF00');
      expect(css).toContain('--border-radius-small: 4px');
    });
  });

  describe('error handling', () => {
    test('should throw error when Figma client is not initialized', async () => {
      const figmation = new Figmation();
      await expect(figmation.generateFromFigma()).rejects.toThrow(
        'Figma access token and file ID are required',
      );
    });

    test('should handle file write errors', async () => {
      const variables = [
        {
          id: '1',
          name: 'test',
          value: '#000',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: false,
        },
      ];

      const figmation = new Figmation();
      await expect(figmation.writeCSS(variables, 'default', { 
        filePath: 'error/test/file.css'  // Specify a non-existent directory path
      })).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    test('should use default config values', () => {
      const figmation = new Figmation();
      expect(figmation['config'].outputPath).toBe('./');
      expect(figmation['config'].filename).toBe('variables.css');
    });

    test('should merge custom config with defaults', () => {
      const figmation = new Figmation({
        outputPath: './custom',
        filename: 'custom.css',
      });
      expect(figmation['config'].outputPath).toBe('./custom');
      expect(figmation['config'].filename).toBe('custom.css');
    });
  });

  describe('variable processing', () => {
    test('should handle hidden variables', () => {
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Hidden Color',
          value: '#FF0000',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: true,
        },
        {
          id: '2',
          name: 'Visible Color',
          value: '#00FF00',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: false,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      expect(css).toContain('/* Colors */');
      expect(css).not.toContain('--color-hidden-color');
      expect(css).toContain('--color-visible-color: #00FF00');
    });
  });

  describe('file operations', () => {
    const testOutputPath = './test-output';
    const testFilename = 'test-variables.css';

    beforeEach(() => {
      // Ensure test directory exists before each test
      if (!existsSync(testOutputPath)) {
        mkdirSync(testOutputPath, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up after each test
      if (existsSync(testOutputPath)) {
        rmSync(testOutputPath, { recursive: true, force: true });
      }
    });

    test('should write CSS file successfully', async () => {
      const figmation = new Figmation({
        outputPath: testOutputPath,
        filename: testFilename,
      });

      const variables: Variable[] = [
        {
          id: '1',
          name: 'Test',
          value: '#000',
          scope: 'ALL_FILLS' as VariableScope,
          hidden: false,
        },
      ];

      await figmation.writeCSS(variables, 'default', {
        filePath: join(testOutputPath, testFilename)
      });

      const filePath = join(testOutputPath, testFilename);
      expect(existsSync(filePath)).toBe(true);

      const fileContent = readFileSync(filePath, 'utf-8');
      expect(fileContent).toContain('--color-test: #000');
    });
  });

  describe('variable conversion', () => {
    test('should convert Figma variables to internal format', () => {
      const figmation = new Figmation();
      const figmaVariables: FigmaVariable[] = [
        {
          id: '1',
          name: 'Primary Color',
          value: '#FF0000',
          scopes: ['ALL_FILLS'],
          hiddenFromPublishing: false,
          valuesByMode: {
            mode1: '#FF0000',
          },
        },
        {
          id: '2',
          name: 'Font Size',
          value: '16px',
          scopes: ['FONT_SIZE'],
          hiddenFromPublishing: false,
          valuesByMode: {
            mode1: '16px',
          },
        },
        {
          id: '3',
          name: 'Invalid Scope',
          value: '100',
          scopes: ['INVALID_SCOPE'],
          hiddenFromPublishing: false,
          valuesByMode: {
            mode1: '100',
          },
        },
      ];

      const variables = figmation['convertFigmaVariables'](figmaVariables);

      expect(variables).toHaveLength(3);
      expect(variables[0]).toEqual({
        id: '1',
        name: 'Primary Color',
        value: '#FF0000',
        scope: 'ALL_FILLS',
        hidden: false,
      });
      expect(variables[1]).toEqual({
        id: '2',
        name: 'Font Size',
        value: '16px',
        scope: 'FONT_SIZE',
        hidden: false,
      });
      expect(variables[2]).toEqual({
        id: '3',
        name: 'Invalid Scope',
        value: '100',
        scope: 'ALL_FILLS',
        hidden: false,
      });
    });

    test('should handle empty scopes array', () => {
      const figmation = new Figmation();
      const figmaVariables: FigmaVariable[] = [
        {
          id: '1',
          name: 'No Scope',
          value: '#FF0000',
          scopes: [],
          hiddenFromPublishing: false,
          valuesByMode: {
            mode1: '#FF0000',
          },
        },
      ];

      const variables = figmation['convertFigmaVariables'](figmaVariables);
      expect(variables[0].scope).toBe('ALL_FILLS');
    });
  });

  describe('formatVariableName', () => {
    it('should format variable names correctly', () => {
      const figmation = new Figmation();
      expect(figmation['formatVariableName']('Typography/Heading/Size', 'FONT_SIZE')).toBe(
        '--font-size-heading',
      );
      expect(figmation['formatVariableName']('Colors/Primary', 'ALL_FILLS')).toBe(
        '--color-primary',
      );
    });
  });

  describe('formatVariableValue', () => {
    it('should add px to size-related values', () => {
      const figmation = new Figmation();
      expect(figmation['formatVariableValue'](16, 'FONT_SIZE')).toBe('16px');
      expect(figmation['formatVariableValue'](1.5, 'LINE_HEIGHT')).toBe('1.5px');
    });

    it('should return raw value for colors and opacity', () => {
      const figmation = new Figmation();
      expect(figmation['formatVariableValue']('#FF0000', 'ALL_FILLS')).toBe('#FF0000');
      expect(figmation['formatVariableValue'](0.5, 'OPACITY')).toBe('0.5');
    });
  });

  describe('variable grouping and CSS generation', () => {
    it('should group variables by category', () => {
      const figmation = new Figmation();
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Spacing/Base',
          value: '8',
          scope: 'GAP',
          hidden: false,
        },
        {
          id: '2',
          name: 'Colors/Text/Primary',
          value: '#000000',
          scope: 'ALL_FILLS',
          hidden: false,
        },
      ];

      const grouped = figmation['groupVariables'](variables);
      expect(grouped.some((g) => g.name === 'Spacing')).toBe(true);
      expect(grouped.some((g) => g.name === 'Colors')).toBe(true);
    });

    it('should generate CSS with all variable categories', () => {
      const figmation = new Figmation();
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Font/Body',
          value: '16',
          scope: 'FONT_SIZE',
          hidden: false,
        },
        {
          id: '2',
          name: 'Spacing/Gap',
          value: '16',
          scope: 'GAP',
          hidden: false,
        },
        {
          id: '3',
          name: 'Effect/Shadow',
          value: '0.2',
          scope: 'EFFECT_FLOAT',
          hidden: false,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      expect(css).toContain('/* Font */');
      expect(css).toContain('/* Spacing */');
      expect(css).toContain('/* Effect */');
    });
  });

  describe('getVariableCategory', () => {
    it('should return correct category for different scopes', () => {
      const figmation = new Figmation();
      expect(figmation['getVariableCategory']('Typography/Size', 'FONT_SIZE')).toBe('Typography');
      expect(figmation['getVariableCategory']('Layout/Spacing', 'GAP')).toBe('Layout');
      expect(figmation['getVariableCategory']('Colors/Primary', 'ALL_FILLS')).toBe('Colors');
      expect(figmation['getVariableCategory']('Effects/Shadow', 'EFFECT_FLOAT')).toBe('Effects');
    });
  });

  describe('transformFigmaVariable', () => {
    it('should transform Figma variable with multiple scopes', () => {
      const figmation = new Figmation();
      const figmaVar: FigmaVariable = {
        id: '1',
        name: 'Test Variable',
        value: '16',
        scopes: ['FONT_SIZE', 'SPACING'],
        hiddenFromPublishing: false,
        valuesByMode: { mode1: '16' },
      };

      const result = figmation['transformFigmaVariable'](figmaVar);
      expect(result.scope).toBe('FONT_SIZE');
      expect(result.value).toBe('16');
    });
  });

  describe('variable transformation', () => {
    it('should transform variables correctly', () => {
      const figmation = new Figmation();
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Typography/Body/Size',
          value: '16',
          scope: 'FONT_SIZE',
          hidden: false,
        },
        {
          id: '2',
          name: 'Colors/Primary',
          value: '#000000',
          scope: 'ALL_FILLS',
          hidden: false,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      expect(css).toContain('--font-size-body');
      expect(css).toContain('--color-primary');
    });

    it('should handle hidden variables', () => {
      const figmation = new Figmation();
      const variables: Variable[] = [
        {
          id: '1',
          name: 'Hidden/Variable',
          value: '16',
          scope: 'FONT_SIZE',
          hidden: true,
        },
      ];

      const css = figmation.generateCSS(variables, 'default');
      expect(css).not.toContain('Hidden/Variable');
    });
  });
});
