---
name: react-next-best-practices
description: Performance and architecture guidance for React and Next.js applications.
---

# React and Next Best Practices

## Priorities

1. Избегать data waterfalls.
2. Не раздувать client bundle.
3. Держать server/client boundaries ясными.
4. Не тащить client components без реальной причины.
5. Параллелить независимые операции.

## Rules

- route-level orchestration должна быть тонкой;
- тяжёлая логика не должна жить в `page.tsx`;
- server components использовать по умолчанию там, где нет интерактива;
- независимые запросы запускать параллельно;
- динамически грузить тяжёлые куски интерфейса;
- не делать premature memoization без реальной причины;
- думать про hydration, bundle size и UX одновременно.

## For this project

- SEO-critical content должен рендериться надёжно;
- локализация не должна ломать routing и metadata;
- auth и data flows не должны размывать границу между `Next.js` и `Python backend`.
