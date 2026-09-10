import {
  Atom,
  Boxes,
  ExternalLink,
  Gauge,
  GitBranch,
  Server,
  Sparkles,
  Wind,
} from 'lucide-react'

export const STACK_LOGOS = [
  { label: 'React', color: '#61DAFB', icon: <Atom className="size-4" /> },
  { label: 'TypeScript', color: '#3178C6', icon: <Boxes className="size-4" /> },
  { label: 'Tailwind', color: '#38BDF8', icon: <Wind className="size-4" /> },
  { label: 'Node', color: '#8CC84B', icon: <Server className="size-4" /> },
  { label: 'Rust', color: '#F97316', icon: <Sparkles className="size-4" /> },
  {
    label: 'Tauri',
    color: '#24C8DB',
    icon: <ExternalLink className="size-4" />,
  },
  { label: 'Vite', color: '#A78BFA', icon: <Gauge className="size-4" /> },
  { label: 'Motion', color: '#F472B6', icon: <GitBranch className="size-4" /> },
]
