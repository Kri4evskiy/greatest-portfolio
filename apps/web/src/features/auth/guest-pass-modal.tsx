'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  type GuestPassFormInput,
  GuestPassFormSchema,
  VISITOR_ROLE_LABELS,
  type VisitorRoleType,
} from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Callout,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui'
import { KeyRound, LockOpen, ShieldCheck, Sparkles, Terminal } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useIssueGuestPassMutation } from '@/hooks/use-visitor-profile'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

const ONE_CLICK_PRESETS: ReadonlyArray<{
  label: string
  displayName: string
  visitorType: VisitorRoleType
}> = [
  {
    label: '⚡ Alex (Team Lead)',
    displayName: 'Alex • Team Lead',
    visitorType: 'TEAM_LEAD',
  },
  {
    label: '🎯 Maria (Tech Recruiter)',
    displayName: 'Maria • Tech Recruiter',
    visitorType: 'RECRUITER',
  },
  {
    label: '🚀 David (CTO / Founder)',
    displayName: 'David • CTO',
    visitorType: 'FOUNDER',
  },
]

const VISITOR_ROLES: readonly VisitorRoleType[] = ['TEAM_LEAD', 'RECRUITER', 'DEVELOPER', 'FOUNDER', 'OTHER']

export function GuestPassModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOpen = useUIStore((s) => s.isGuestPassModalOpen)
  const pendingRedirectPath = useUIStore((s) => s.pendingRedirectPath)
  const openModal = useUIStore((s) => s.openGuestPassModal)
  const closeModal = useUIStore((s) => s.closeGuestPassModal)

  const [showAdminInput, setShowAdminInput] = useState(false)
  const issuePassMutation = useIssueGuestPassMutation()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GuestPassFormInput>({
    resolver: zodResolver(GuestPassFormSchema),
    defaultValues: {
      displayName: 'Alex • Team Lead',
      visitorType: 'TEAM_LEAD',
      adminPasscode: '',
    },
  })

  const selectedVisitorType = useWatch({
    control,
    name: 'visitorType',
  })

  useEffect(() => {
    const unlockParam = searchParams.get('unlock')
    const redirectParam = searchParams.get('redirect')
    if (unlockParam === 'knowledge-base') {
      openModal(redirectParam ?? '/knowledge-base')
      trackEvent('guest_pass_modal_opened', { source: 'middleware_redirect' })
    }
  }, [searchParams, openModal])

  const onSubmit = async (values: GuestPassFormInput) => {
    const profile = await issuePassMutation.mutateAsync(values)
    trackEvent('guest_pass_unlocked', {
      visitorType: profile.visitorType,
      role: profile.role,
    })
    closeModal()
    router.push(pendingRedirectPath ?? '/knowledge-base')
    router.refresh()
  }

  const applyPresetAndUnlock = async (preset: { displayName: string; visitorType: VisitorRoleType }) => {
    setValue('displayName', preset.displayName, { shouldValidate: true })
    setValue('visitorType', preset.visitorType, { shouldValidate: true })
    await onSubmit({
      displayName: preset.displayName,
      visitorType: preset.visitorType,
      adminPasscode: '',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? openModal() : closeModal())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px]">
              RBAC • JWT HttpOnly Cookie
            </Badge>
            <Badge variant="secondary" className="font-mono text-[11px]">
              packages/shared-schemas
            </Badge>
          </div>
          <DialogTitle className="mt-2 flex items-center gap-2 text-xl">
            <LockOpen className="h-5 w-5 text-primary" />
            Гостевой пропуск в Базу Знаний (1-Click Guest Pass)
          </DialogTitle>
          <DialogDescription>
            Раздел инженерных разборов и D3.js-симуляций защищен на уровне{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Next.js Edge Middleware</code> и{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">JwtRolesGuard</code>.
          </DialogDescription>
        </DialogHeader>

        <Callout
          variant="info"
          title="Живое архитектурное демо без паролей и спама"
          icon={<Terminal className="h-4 w-4" />}
          className="my-1 text-xs"
        >
          Выбери пресет в <strong>1 клик</strong> или укажи свое имя — это демонстрация связки{' '}
          <code>React Hook Form</code> + <code>Zod</code> + <code>NestJS JWT HttpOnly Cookie</code> + <code>RBAC</code>{' '}
          + <code>SSE Telemetry</code>.
        </Callout>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Быстрый вход в 1 клик (мгновенная выдача куки и редирект):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ONE_CLICK_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSubmitting || issuePassMutation.isPending}
                onClick={() => void applyPresetAndUnlock(preset)}
                className="h-7 text-xs font-medium"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="guest-display-name" className="text-xs font-medium">
              Имя или никнейм гостя
            </label>
            <Input id="guest-display-name" placeholder="Например: Alex (Team Lead)" {...register('displayName')} />
            {errors.displayName ? <p className="text-xs text-red-600">{errors.displayName.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium">Ваша роль в команде</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {VISITOR_ROLES.map((roleKey) => {
                const isSelected = selectedVisitorType === roleKey
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setValue('visitorType', roleKey, { shouldValidate: true })}
                    className={`rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'border-border bg-background hover:bg-accent text-foreground'
                    }`}
                  >
                    {VISITOR_ROLE_LABELS[roleKey]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdminInput((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {showAdminInput ? 'Скрыть поле Admin Passcode' : 'Я владелец портфолио (Admin Passcode → роль ADMIN)'}
            </button>

            {showAdminInput ? (
              <div className="mt-2 space-y-1">
                <Input
                  type="password"
                  placeholder="Введите секретный ключ администратора (опционально)"
                  {...register('adminPasscode')}
                />
                <p className="text-[11px] text-muted-foreground">
                  Демо-ключ для проверяющего тимлида: <code>workfolio-admin-2026</code>
                </p>
              </div>
            ) : null}
          </div>

          {issuePassMutation.isError ? (
            <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-600">
              {issuePassMutation.error instanceof Error ? issuePassMutation.error.message : 'Ошибка соединения с API'}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Set-Cookie: HttpOnly; SameSite=Lax</span>
            </div>
            <Button type="submit" disabled={isSubmitting || issuePassMutation.isPending} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              {issuePassMutation.isPending ? 'Выпускаем JWT пропуск...' : 'Разблокировать Базу Знаний'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
