import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowLeft, BookOpen, Compass } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/shared/i18n/navigation'

export default async function LocaleNotFoundPage() {
  const t = await getTranslations('NotFound')

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full border-border bg-card shadow-sm">
        <CardHeader className="space-y-3 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <Badge variant="outline" className="gap-1.5 font-mono text-xs text-primary">
              <Compass className="h-3.5 w-3.5" />
              <span>{t('badge')}</span>
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span>{t('backHomeBtn')}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/knowledge-base">
              <BookOpen className="h-4 w-4" />
              <span>{t('openKbBtn')}</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
