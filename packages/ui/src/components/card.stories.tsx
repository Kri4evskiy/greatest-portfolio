import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'Workfolio UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const ProjectCaseStudy: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="core">Full-Stack Monorepo</Badge>
          <span className="text-xs text-muted-foreground">ADR #1–#15</span>
        </div>
        <CardTitle className="mt-2">Enterprise Portfolio & Knowledge Base</CardTitle>
        <CardDescription>
          Next.js App Router, NestJS, Prisma, Microservices SSE & Offline-First IndexedDB cache.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Built with strict TypeScript, Biome.js, and zero-runtime overhead UI primitives.
        </p>
      </CardContent>
    </Card>
  ),
};
