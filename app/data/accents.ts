export type AccentPreset = {
  color: string
  id: string
  label: string
  rgb: string
  lightColor?: string
  lightRgb?: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'pink',
    label: 'Pink',
    color: '#F598F2',
    rgb: '245 152 242',
    lightColor: '#b82b9e',
    lightRgb: '184 43 158',
  },
  {
    id: 'cyan',
    label: 'Cyan',
    color: '#58D5FF',
    rgb: '88 213 255',
    lightColor: '#0284c7',
    lightRgb: '2 132 199',
  },
  {
    id: 'lime',
    label: 'Lime',
    color: '#A3E635',
    rgb: '163 230 53',
    lightColor: '#4d7c0f',
    lightRgb: '77 124 15',
  },
  {
    id: 'amber',
    label: 'Amber',
    color: '#FBBF24',
    rgb: '251 191 36',
    lightColor: '#b45309',
    lightRgb: '180 83 9',
  },
  {
    id: 'coral',
    label: 'Coral',
    color: '#FB7185',
    rgb: '251 113 133',
    lightColor: '#e11d48',
    lightRgb: '225 29 72',
  },
]
