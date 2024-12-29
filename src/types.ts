export const VARIABLE_SCOPES = [
  'ALL_SCOPES',
  'TEXT_CONTENT',
  'CORNER_RADIUS',
  'WIDTH_HEIGHT',
  'GAP',
  'ALL_FILLS',
  'FRAME_FILL',
  'SHAPE_FILL',
  'TEXT_FILL',
  'STROKE_COLOR',
  'EFFECT_COLOR',
  'STROKE_FLOAT',
  'EFFECT_FLOAT',
  'OPACITY',
  'FONT_FAMILY',
  'FONT_STYLE',
  'FONT_WEIGHT',
  'FONT_SIZE',
  'LINE_HEIGHT',
  'LETTER_SPACING',
  'PARAGRAPH_SPACING',
  'PARAGRAPH_INDENT',
] as const;

export type VariableScope = (typeof VARIABLE_SCOPES)[number];

export interface Variable {
  id: string;
  name: string;
  value: any;
  valuesByMode?: { [key: string]: any };
  scope: VariableScope;
  hidden: boolean;
}

export interface VariableGroup {
  name: string;
  variables: Variable[];
}

export interface CSSGenerationOptions {
  prefix?: string;
  groupByCollection?: boolean;
  includeHidden?: boolean;
  unit?: string;
  baseFontSize?: number;
}

export interface FigmaVariable {
  id: string;
  name: string;
  value: any;
  scopes: string[];
  hiddenFromPublishing: boolean;
  valuesByMode: {
    [key: string]: any;
  };
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variables: FigmaVariable[];
}

export interface FigmaAPIResponse {
  status: number;
  error?: boolean;
  meta: {
    variableCollections: { [key: string]: FigmaVariableCollection };
  };
}

export interface ScopePrefixMap {
  [key: string]: string;
}
