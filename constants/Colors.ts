/** Gen 1 / Game Boy–inspired nostalgic Pokemon palette */
export const Pokemon = {
  red: '#CC0000',
  blue: '#3B4CCA',
  yellow: '#FFDE00',
  cream: '#FFF8E7',
  parchment: '#F7E0B0',
  navy: '#1D2C5E',
  gbLight: '#9BBC0F',
  gbMid: '#306230',
  gbDark: '#0F380F',
  tan: '#C4A574',
} as const;

const tintColorLight = Pokemon.red;
const tintColorDark = Pokemon.yellow;

export default {
  light: {
    text: Pokemon.navy,
    background: Pokemon.cream,
    tint: tintColorLight,
    tabIconDefault: Pokemon.tan,
    tabIconSelected: tintColorLight,
    surface: Pokemon.parchment,
    surfaceAlt: '#FFE8A3',
    accent: Pokemon.blue,
    highlight: Pokemon.yellow,
    border: Pokemon.blue,
  },
  dark: {
    text: Pokemon.cream,
    background: Pokemon.gbDark,
    tint: tintColorDark,
    tabIconDefault: Pokemon.gbMid,
    tabIconSelected: tintColorDark,
    surface: Pokemon.gbMid,
    surfaceAlt: '#1B4D1B',
    accent: '#6B9FFF',
    highlight: Pokemon.yellow,
    border: Pokemon.gbLight,
  },
};
