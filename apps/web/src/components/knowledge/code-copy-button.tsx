'use client'

import { Check, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function CodeCopyButton({ code }: { code: string }) {
  const t = useTranslations('KnowledgeBase')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard API unavailable in non-secure context
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? t('copiedCode') : t('copyCode')}
      className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">{t('copiedCode')}</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{t('copyCode')}</span>
        </>
      )}
    </button>
  )
}
