import { AlertTriangle, Info, Lightbulb, Quote, ShieldAlert, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MdxCalloutKind } from '@/entities/knowledge-content'

export function resolveCalloutConfig(kind: MdxCalloutKind): {
  variant: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  defaultTitle: string | undefined
  icon: ReactNode
} {
  switch (kind) {
    case 'tip':
      return {
        variant: 'success',
        defaultTitle: 'Tip',
        icon: <Lightbulb className="h-4 w-4" />,
      }
    case 'important':
      return {
        variant: 'info',
        defaultTitle: 'Important',
        icon: <Sparkles className="h-4 w-4" />,
      }
    case 'warning':
      return {
        variant: 'warning',
        defaultTitle: 'Warning',
        icon: <AlertTriangle className="h-4 w-4" />,
      }
    case 'caution':
      return {
        variant: 'destructive',
        defaultTitle: 'Caution',
        icon: <ShieldAlert className="h-4 w-4" />,
      }
    case 'note':
      return {
        variant: 'info',
        defaultTitle: 'Note',
        icon: <Info className="h-4 w-4" />,
      }
    case 'quote':
      return {
        variant: 'default',
        defaultTitle: undefined,
        icon: <Quote className="h-4 w-4 text-muted-foreground" />,
      }
  }
}
