import { Variable, VariableScope } from '../../types';

export const mockFigmaVariables: Variable[] = [
  {
    id: '1',
    name: 'Colors/Primary',
    value: '#FF0000',
    scope: 'ALL_FILLS' as VariableScope,
    hidden: false,
  },
  {
    id: '2',
    name: 'Typography/Size/Large',
    value: '24',
    scope: 'FONT_SIZE' as VariableScope,
    hidden: false,
  },
  {
    id: '3',
    name: 'Layout/Border Radius/Small',
    value: '4',
    scope: 'CORNER_RADIUS' as VariableScope,
    hidden: false,
  },
];
