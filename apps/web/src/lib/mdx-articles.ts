import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { KnowledgeCategory } from '@repo/shared-schemas';
import { cache } from 'react';

export interface MdxArticleFrontmatter {
  slug: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  readTime: string;
  embedGraph: 'react-render' | 'architecture-flow' | 'none';
}

export interface MdxArticleDocument extends MdxArticleFrontmatter {
  body: string;
}

const VALID_CATEGORIES: readonly KnowledgeCategory[] = [
  'typescript',
  'react',
  'nestjs-prisma',
  'architecture-devops',
];

function parseFrontmatterAndBody(raw: string): {
  attributes: Record<string, string>;
  body: string;
} {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { attributes: {}, body: normalized };
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { attributes: {}, body: normalized };
  }

  const rawFrontmatter = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5).trim();
  const attributes: Record<string, string> = {};

  for (const line of rawFrontmatter.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line
      .slice(colonIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    attributes[key] = val;
  }

  return { attributes, body };
}

export const getAllMdxArticles = cache((): MdxArticleDocument[] => {
  const contentRoot = join(process.cwd(), 'content');
  if (!existsSync(contentRoot)) {
    return [];
  }

  const results: MdxArticleDocument[] = [];

  for (const category of VALID_CATEGORIES) {
    const categoryDir = join(contentRoot, category);
    if (!existsSync(categoryDir)) continue;

    const files = readdirSync(categoryDir).filter((file) => file.endsWith('.mdx'));
    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '');
      const fullPath = join(categoryDir, file);
      const raw = readFileSync(fullPath, 'utf8');
      const { attributes, body } = parseFrontmatterAndBody(raw);

      const embedGraphAttr = attributes.embedGraph;
      const embedGraph =
        embedGraphAttr === 'react-render' || embedGraphAttr === 'architecture-flow'
          ? embedGraphAttr
          : 'none';

      results.push({
        slug,
        category,
        title: attributes.title ?? slug,
        summary: attributes.summary ?? '',
        readTime: attributes.readTime ?? '5 мин',
        embedGraph,
        body,
      });
    }
  }

  return results;
});

export const getMdxArticleBySlug = cache(
  (category: string, slug: string): MdxArticleDocument | null => {
    const all = getAllMdxArticles();
    return all.find((item) => item.category === category && item.slug === slug) ?? null;
  },
);
