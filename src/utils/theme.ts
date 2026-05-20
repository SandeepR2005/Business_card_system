// Color palette and theme for AskEva
export const EVA = {
  green: '#52C41A',
  greenDeep: '#3B9612',
  greenSoft: '#E8F8DC',
  greenInk: '#0F1F08',
  ink: '#0E1410',
  body: '#3B4339',
  muted: '#6A7567',
  hairline: '#E6E8E2',
  surface: '#FFFFFF',
  canvas: '#F5F6F2',
  chip: '#F1F3EC',
  warn: '#E08A1E',
  warnSoft: '#FCEED6',
  danger: '#D93B3B',
  dangerSoft: '#FCE5E5',
  info: '#2E7AE6',
  infoSoft: '#E1ECFB',
};

export const SCORE_FIELDS = [
  { k: 'designation', l: 'Designation match', max: 20 },
  { k: 'company', l: 'Company size', max: 20 },
  { k: 'email', l: 'Email replied', max: 20 },
  { k: 'brochure', l: 'Brochure opened', max: 20 },
  { k: 'event', l: 'Event relevance', max: 20 },
];

export function scoreBand(s: number): 'high' | 'mid' | 'low' {
  if (s >= 75) return 'high';
  if (s >= 40) return 'mid';
  return 'low';
}

export function getScoreColor(band: 'high' | 'mid' | 'low'): string {
  switch (band) {
    case 'high':
      return EVA.green;
    case 'mid':
      return EVA.warn;
    case 'low':
      return EVA.danger;
  }
}
