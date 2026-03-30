export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green' | 'gray';

export interface CubeState {
  U: Color[]; // Up
  D: Color[]; // Down
  L: Color[]; // Left
  R: Color[]; // Right
  F: Color[]; // Front
  B: Color[]; // Back
}

export const INITIAL_STATE: CubeState = {
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
};

export const COLOR_MAP: Record<Color, string> = {
  white: '#FFFFFF',
  yellow: '#FFFF00',
  red: '#FF0000',
  orange: '#FFA500',
  blue: '#0000FF',
  green: '#008000',
  gray: '#333333',
};

export const FACE_NAMES = {
  U: 'Up (White)',
  D: 'Down (Yellow)',
  L: 'Left (Orange)',
  R: 'Right (Red)',
  F: 'Front (Green)',
  B: 'Back (Blue)',
};
