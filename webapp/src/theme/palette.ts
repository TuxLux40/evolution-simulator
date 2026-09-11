// Canvas colors can't read CSS custom properties cheaply every frame, so the
// world-render palette is mirrored here in JS, one entry per resolved theme.

export interface CanvasPalette {
  background: string;
  barrier: string;
  terrainCold: [number, number, number];
  terrainHot: [number, number, number];
  pheromone: string;
  selectionRing: string;
  survivorRing: string;
}

export const CANVAS_PALETTES: Record<'light' | 'dark', CanvasPalette> = {
  dark: {
    background: '#0b1220',
    barrier: '#374151',
    terrainCold: [30, 60, 140],
    terrainHot: [190, 120, 40],
    pheromone: '56, 189, 248',
    selectionRing: '#facc15',
    survivorRing: '74, 222, 128',
  },
  light: {
    background: '#eef2f7',
    barrier: '#9ca3af',
    terrainCold: [147, 197, 253],
    terrainHot: [253, 186, 116],
    pheromone: '2, 132, 199',
    selectionRing: '#b45309',
    survivorRing: '21, 128, 61',
  },
};
