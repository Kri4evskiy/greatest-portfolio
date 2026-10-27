'use client';

import { useIssueGuestPass } from '@/hooks/use-session';
import { useUIStore } from '@/store/use-ui-store';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type GuestPassFormInput,
  GuestPassFormSchema,
  VISITOR_ROLE_LABELS,
  type VisitorRoleType,
} from '@repo/shared-schemas';
import {
  Badge,
  Button,
  Callout,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import { KeyRound, LockOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';

const QUICK_PRESETS: ReadonlyArray<{
  label: string;
  displayName: string;
  visitorType: VisitorRoleType;
}> = [
  { label: '⚡ Team Lead (1-click)', displayName: 'Alex (Team Lead)', visitorType: 'TEAM_LEAD' },
  {
    label: '🎯 Tech Recruiter',
    displayName: 'Maria (Tech Recruiter)',
    visitorType: 'RECRUITER',
  },
  {
    label: '🛠️ Senior Engineer',
    displayName: 'Dmitry (Staff Engineer)',
    visitorType: 'DEVELOPER',
  },
];

const VISITOR_ROLES: readonly VisitorRoleType[] = [
  'TEAM_LEAD',
  'RECRUITER',
  'DEVELOPER',
  'FOUNDER',
  'OTHER',
];

export function GuestPassModal(): React.JSX.Element {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isGuestPassModalOpen);
  const redirectAfterUnlock = useUIStore((s) => s.redirectAfterUnlock);
  const closeModal = useUIStore((s) => s.closeGuestPassModal);

  const [showAdminInput, setShowAdminInput] = React.useState(false);
  const issueGuestPass = useIssueGuestPass();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GuestPassFormInput>({
    resolver: zodResolver(GuestPassFormSchema),
    defaultValues: {
      displayName: 'Alex (Team Lead)',
      visitorType: 'TEAM_LEAD',
      adminPasscode: '',
    },
  });

  const selectedVisitorType = useWatch({
    control,
    name: 'visitorType',
  });

  const onSubmit = async (values: GuestPassFormInput): Promise<void> => {
    await issueGuestPass.mutateAsync(values);
    const targetPath = redirectAfterUnlock ?? '/knowledge-base';
    closeModal();
    router.push(targetPath);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="core">RBAC + HttpOnly JWT Demo</Badge>
            <Badge variant="outline">Zero Passwords</Badge>
          </div>
          <DialogTitle className="mt-2 flex items-center gap-2 text-xl">
            <LockOpen className="h-5 w-5 text-emerald-600" />
            Unlock Engineering Base of Knowledge
          </DialogTitle>
          <DialogDescription>
            Закрытый раздел защищен на уровне Next.js Edge Middleware и NestJS JwtRolesGuard.
          </DialogDescription>
        </DialogHeader>

        <Callout icon="🧪" title="Для Team Lead и Рекрутера (в 1 клик)">
          Введи любое имя или нажми пресет ниже — это живое демо работы{' '}
          <code className="rounded bg-background px-1 py-0.5 text-xs font-mono">
            React Hook Form + Zod + NestJS JWT HttpOnly Cookies + RBAC + SSE
          </code>
          . После сабмита замок в шапке сменится на 🔓 и откроется доступ к интерактивным статьям и
          D3.js графикам.
        </Callout>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Быстрое заполнение в 1 клик:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setValue('displayName', preset.displayName, { shouldValidate: true });
                    setValue('visitorType', preset.visitorType, { shouldValidate: true });
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="guest-display-name" className="text-xs font-medium text-foreground">
              Ваше имя или никнейм
            </label>
            <Input
              id="guest-display-name"
              placeholder="Например: Alex (Team Lead)"
              {...register('displayName')}
            />
            {errors.displayName ? (
              <p className="text-xs text-red-600">{errors.displayName.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Ваша роль в компании</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VISITOR_ROLES.map((roleKey) => {
                const isSelected = selectedVisitorType === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setValue('visitorType', roleKey, { shouldValidate: true })}
                    className={`rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {VISITOR_ROLE_LABELS[roleKey]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdminInput((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {showAdminInput
                ? 'Скрыть ключ владельца (Admin RBAC)'
                : 'У меня есть ключ владельца (Admin RBAC)'}
            </button>
            {showAdminInput ? (
              <div className="mt-2 space-y-1">
                <Input
                  type="password"
                  placeholder="Secret Admin Passcode (demo: workfolio-admin-2026)"
                  {...register('adminPasscode')}
                />
                <p className="text-[11px] text-muted-foreground">
                  Для демо проверки роли ADMIN используй код:{' '}
                  <code className="font-mono">workfolio-admin-2026</code>
                </p>
              </div>
            ) : null}
          </div>

          {issueGuestPass.isError ? (
            <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-600">
              Не удалось выпустить пропуск. Проверьте, что запущен бэкенд apps/api.
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || issueGuestPass.isPending}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {issueGuestPass.isPending
                ? 'Подписываем JWT куку...'
                : 'Получить Guest Pass и открыть 🔓'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
