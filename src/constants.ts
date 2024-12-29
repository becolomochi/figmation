import { ScopePrefixMap } from './types';

export const DEFAULT_SCOPE_PREFIXES: ScopePrefixMap = {
  ALL_SCOPES: '',
  TEXT_CONTENT: 'text',
  CORNER_RADIUS: 'border-radius',
  WIDTH_HEIGHT: 'size',
  GAP: 'gap',
  // Unified prefix 'color' for all FILL and COLOR variables
  ALL_FILLS: 'color',
  FRAME_FILL: 'color',
  SHAPE_FILL: 'color',
  TEXT_FILL: 'color',
  STROKE_COLOR: 'color',
  EFFECT_COLOR: 'color',
  // Typography-related prefixes
  FONT_FAMILY: 'font-family',
  FONT_STYLE: 'font-style',
  FONT_WEIGHT: 'font-weight',
  FONT_SIZE: 'font-size',
  LINE_HEIGHT: 'line-height',
  LETTER_SPACING: 'letter-spacing',
  // Other prefixes remain unchanged
  STROKE_FLOAT: 'border',
  EFFECT_FLOAT: 'effect',
  OPACITY: 'opacity',
  PARAGRAPH_SPACING: 'paragraph',
  PARAGRAPH_INDENT: 'indent',
};
