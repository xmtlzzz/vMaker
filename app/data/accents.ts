export type AccentPreset = {
  color: string
  id: string
  label: string
  rgb: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'pink', label: 'Pink', color: '#F598F2', rgb: '245 152 242' },
  { id: 'cyan', label: 'Cyan', color: '#58D5FF', rgb: '88 213 255' },
  { id: 'lime', label: 'Lime', color: '#A3E635', rgb: '163 230 53' },
  { id: 'amber', label: 'Amber', color: '#FBBF24', rgb: '251 191 36' },
  { id: 'coral', label: 'Coral', color: '#FB7185', rgb: '251 113 133' },
]
