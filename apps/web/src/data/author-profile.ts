import type { SupportedLocale } from '@repo/shared-schemas'

export interface LocalizedText {
  en: string
  uk: string
  ru: string
}

export interface AuthorSkillGroup {
  id: string
  label: LocalizedText
  skills: readonly string[]
}

export interface CommercialExperienceItem {
  id: string
  company: string
  domain: LocalizedText
  engagement: LocalizedText
  period: LocalizedText
  projects: readonly string[]
  featured: boolean
  highlights: {
    en: readonly string[]
    uk: readonly string[]
    ru: readonly string[]
  }
  technologies: readonly string[]
}

export const AUTHOR_PROFILE = {
  initials: 'SK',
  handle: 'stanislav-krychevskyi',
  fullName: {
    en: 'Stanislav Krychevskyi',
    uk: 'Станіслав Кричевський',
    ru: 'Станислав Кричевский',
  } satisfies LocalizedText,
  roleTitle: {
    en: 'Senior Frontend / Fullstack Engineer',
    uk: 'Senior Frontend / Fullstack Engineer',
    ru: 'Senior Frontend / Fullstack Engineer',
  } satisfies LocalizedText,
  location: {
    en: 'Kyiv, Ukraine (Remote / Hybrid)',
    uk: 'Київ, Україна (Remote / Hybrid)',
    ru: 'Киев, Украина (Remote / Hybrid)',
  } satisfies LocalizedText,
  yearsOfExperience: '5+',
  contacts: {
    telegramUrl: 'https://t.me/Kri4evskiy',
    telegramHandle: '@Kri4evskiy',
    linkedinUrl: 'https://linkedin.com/in/kri4evskiy',
    linkedinHandle: 'in/kri4evskiy',
    githubUrl: 'https://github.com/Kri4evskiy',
    githubHandle: 'github.com/Kri4evskiy',
    repoUrl: 'https://github.com/Kri4evskiy/greatest-portfolio',
    email: 'kri4evskiy@gmail.com',
  },
  education: {
    institution: {
      en: 'Kyiv International University (2006 – 2011)',
      uk: 'Київський міжнародний університет (2006 – 2011)',
      ru: 'Киевский международный университет (2006 – 2011)',
    } satisfies LocalizedText,
    degree: {
      en: "Master's Degree in International Relations",
      uk: 'Магістр міжнародних відносин',
      ru: 'Магистр международных отношений',
    } satisfies LocalizedText,
  },
  spokenLanguages: {
    en: 'English — Upper-Intermediate (B2) • Ukrainian — Native',
    uk: 'English — Upper-Intermediate (B2) • Українська — Рідна',
    ru: 'English — Upper-Intermediate (B2) • Українська — Родной',
  } satisfies LocalizedText,
} as const

export const AUTHOR_SKILL_GROUPS: readonly AuthorSkillGroup[] = [
  {
    id: 'core',
    label: {
      en: 'Languages & Runtimes',
      uk: 'Мови та Рантайми',
      ru: 'Языки и Рантаймы',
    },
    skills: ['TypeScript (Strict)', 'JavaScript (ESNext)', 'React.js 19', 'Next.js 16', 'Node.js', 'NestJS', 'Python'],
  },
  {
    id: 'state-viz',
    label: {
      en: 'State, Forms & Visualization',
      uk: 'Стейт, Форми та Візуалізація',
      ru: 'Стейт, Формы и Визуализация',
    },
    skills: [
      'TanStack Query / Table',
      'Zustand',
      'Effector',
      'Redux Toolkit',
      'React Hook Form + Zod',
      'XYFlow (React Flow)',
      'D3.js',
    ],
  },
  {
    id: 'backend-db',
    label: {
      en: 'Backend, APIs & Databases',
      uk: 'Бекенд, API та Бази даних',
      ru: 'Бэкенд, API и Базы данных',
    },
    skills: [
      'REST / WebSocket / SSE',
      'tRPC',
      'JWT / OAuth 2.0',
      'Stripe Embedded',
      'PostgreSQL',
      'Prisma ORM',
      'TypeORM',
      'MongoDB',
    ],
  },
  {
    id: 'quality-ai',
    label: {
      en: 'Quality, DevOps & AI Workflows',
      uk: 'Якість, DevOps та AI-інжиніринг',
      ru: 'Качество, DevOps и AI-инжиниринг',
    },
    skills: [
      'Playwright E2E',
      'Vitest / Jest',
      'Docker',
      'Sentry & PostHog',
      'Storybook',
      'Tailwind + shadcn/ui',
      'Cursor / Claude / LLM Workflows',
    ],
  },
]

export const COMMERCIAL_EXPERIENCE: readonly CommercialExperienceItem[] = [
  {
    id: 'superscript-systems',
    company: 'Superscript Systems',
    domain: {
      en: 'E-Commerce & Automation SaaS',
      uk: 'E-Commerce та Automation SaaS',
      ru: 'E-Commerce и Automation SaaS',
    },
    engagement: {
      en: 'Senior Frontend / Fullstack • Outstaff',
      uk: 'Senior Frontend / Fullstack • Outstaff',
      ru: 'Senior Frontend / Fullstack • Outstaff',
    },
    period: {
      en: 'Mar 2024 – Jul 2026',
      uk: 'Бер 2024 – Лип 2026',
      ru: 'Мар 2024 – Июл 2026',
    },
    projects: ['titlepool.com', 'firsttouch.com', 'wallet.niftybridge.io', 'superscriptsystems.com'],
    featured: true,
    highlights: {
      en: [
        'Spearheaded performance optimization, reducing LCP/TTI by 15–40% and cutting memory footprint via memoization and virtualization across 2 production platforms.',
        'Engineered interactive node-based visual automation builders using XYFlow (React Flow) with custom drag-and-drop, edge routing, and Zustand state syncing.',
        'Integrated Sentry + PostHog observability (accelerating production frontend diagnostics by 30%) and Stripe Embedded UI / Elements across 100% of checkout transactions.',
      ],
      uk: [
        'Очолив оптимізацію продуктивності: знизив LCP/TTI на 15–40% і суттєво зменшив споживання пам’яті через мемоїзацію та віртуалізацію на 2 продакшен-платформах.',
        'Спроєктував інтерактивні вузлові конструктори автоматизацій на базі XYFlow (React Flow) із кастомним drag-and-drop, маршрутизацією ребер та синхронізацією стейту в Zustand.',
        'Впровадив моніторинг Sentry + PostHog (прискоривши діагностику помилок у продакшені на 30%) та інтегрував Stripe Embedded UI / Elements для 100% транзакцій чекауту.',
      ],
      ru: [
        'Возглавил оптимизацию производительности: снизил LCP/TTI на 15–40% и существенно сократил потребление памяти за счёт мемоизации и виртуализации на 2 продакшен-платформах.',
        'Спроектировал интерактивные нодовые конструкторы визуальных автоматизаций на XYFlow (React Flow) с кастомным drag-and-drop, роутингом связей и синхронизацией стейта через Zustand.',
        'Внедрил наблюдаемость Sentry + PostHog (ускорив диагностику ошибок в продакшене на 30%) и интегрировал Stripe Embedded UI / Elements для 100% платёжных транзакций чекаута.',
      ],
    },
    technologies: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind',
      'TanStack',
      'Effector',
      'Zustand',
      'XYFlow (React Flow)',
      'React Hook Form',
      'Zod',
      'Stripe Embedded',
      'Sentry',
      'PostHog',
      'NestJS',
    ],
  },
  {
    id: 'risesoft',
    company: 'Risesoft',
    domain: {
      en: 'Crypto • Real-World Asset (RWA) Tokenization',
      uk: 'Crypto • Токенізація реальних активів (RWA)',
      ru: 'Crypto • Токенизация реальных активов (RWA)',
    },
    engagement: {
      en: 'Fullstack / Frontend Engineer • Contract',
      uk: 'Fullstack / Frontend Engineer • Contract',
      ru: 'Fullstack / Frontend Engineer • Contract',
    },
    period: {
      en: 'Dec 2023 – Mar 2024',
      uk: 'Гру 2023 – Бер 2024',
      ru: 'Дек 2023 – Мар 2024',
    },
    projects: ['RWA Tokenization Platform'],
    featured: true,
    highlights: {
      en: [
        'Built end-to-end typesafe API layers using the T3 Stack (Next.js, tRPC, Prisma), eliminating runtime type errors and accelerating contract-to-UI delivery by ~15%.',
        'Developed 8+ interactive financial and analytical dashboards with D3.js and Tailwind for real-time visualization of asset tokenization, liquidity metrics, and portfolio performance.',
        'Established frontend engineering standards from scratch: strict TypeScript configs, linting rules, and architectural documentation for multi-developer scaling.',
      ],
      uk: [
        'Побудував наскрізний типобезпечний API-рівень на T3 Stack (Next.js, tRPC, Prisma), усунувши помилки типів у рантаймі та прискоривши доставку фіч приблизно на 15%.',
        'Розробив 8+ інтерактивних фінансових та аналітичних дашбордів на D3.js і Tailwind для real-time візуалізації токенізації активів і метрик ліквідності.',
        'Заклав інженерні стандарти фронтенду з нуля: суворі конфігурації TypeScript, правила лінтингу та документацію для масштабування команди.',
      ],
      ru: [
        'Построил сквозной типобезопасный API-слой на T3 Stack (Next.js, tRPC, Prisma), устранив ошибки типов в рантайме и ускорив поставку фич примерно на 15%.',
        'Разработал 8+ интерактивных финансовых и аналитических дашбордов на D3.js и Tailwind для real-time визуализации токенизации активов, ликвидности и доходности портфеля.',
        'Выстроил инженерные стандарты фронтенда с нуля: строгий TypeScript, правила линтинга и проектную документацию для масштабирования команды.',
      ],
    },
    technologies: [
      'T3 Stack',
      'Next.js',
      'TypeScript',
      'tRPC',
      'Prisma',
      'D3.js',
      'Tailwind',
      'NextAuth',
      'Redux',
      'Wagmi',
    ],
  },
  {
    id: 'brander',
    company: 'Brander',
    domain: {
      en: 'High-Load E-Commerce',
      uk: 'High-Load E-Commerce',
      ru: 'High-Load E-Commerce',
    },
    engagement: {
      en: 'Frontend Engineer • Outsource / Outstaff',
      uk: 'Frontend Engineer • Outsource / Outstaff',
      ru: 'Frontend Engineer • Outsource / Outstaff',
    },
    period: {
      en: 'Dec 2022 – Oct 2023',
      uk: 'Гру 2022 – Жов 2023',
      ru: 'Дек 2022 – Окт 2023',
    },
    projects: ['shop.kyivstar.ua', 'businessadmin.a1st.app'],
    featured: true,
    highlights: {
      en: [
        'Contributed to high-load e-commerce platforms (including shop.kyivstar.ua), building catalog, product, and checkout flows optimized for 50,000+ DAU and 10,000+ SKUs.',
        'Engineered real-time WebSocket + Redux Toolkit synchronizations powering instant order status updates and administrative dashboards (businessadmin.a1st.app).',
        'Delivered a production e-commerce MVP from scratch in 4 months (frontend architecture, state design, i18n) and mentored 2 junior developers to independent ownership.',
      ],
      uk: [
        'Розвивав високонавантажені e-commerce рішення (зокрема shop.kyivstar.ua): каталог, картки товарів та чекаут під 50 000+ DAU та каталог на 10 000+ SKU.',
        'Реалізував real-time синхронізацію даних через WebSocket і Redux Toolkit для миттєвого оновлення статусів замовлень в адмін-панелі (businessadmin.a1st.app).',
        'Випустив продакшен e-commerce MVP з нуля за 4 місяці (архітектура, стейт, i18n) та провів менторинг 2 junior-розробників до самостійної доставки фіч.',
      ],
      ru: [
        'Развивал высоконагруженные e-commerce решения (включая shop.kyivstar.ua): каталог, карточки товаров и чекаут, оптимизированные под 50 000+ DAU и 10 000+ SKU.',
        'Реализовал real-time синхронизацию через WebSocket и Redux Toolkit для мгновенного обновления статусов заказов и админ-дашбордов (businessadmin.a1st.app).',
        'Выпустил продакшен e-commerce MVP с нуля за 4 месяца (архитектура фронтенда, стейт, i18n) и курировал 2 junior-разработчиков до самостоятельного владения фичами.',
      ],
    },
    technologies: [
      'React',
      'Next.js',
      'TypeScript',
      'Redux Toolkit',
      'WebSocket',
      'Material UI',
      'Styled Components',
      'i18n',
    ],
  },
  {
    id: 'devsx',
    company: 'DevsX',
    domain: {
      en: 'E-Commerce & Well-Being',
      uk: 'E-Commerce та Well-Being',
      ru: 'E-Commerce и Well-Being',
    },
    engagement: {
      en: 'Frontend Engineer • Contract',
      uk: 'Frontend Engineer • Contract',
      ru: 'Frontend Engineer • Contract',
    },
    period: {
      en: 'Jul 2022 – Nov 2022',
      uk: 'Лип 2022 – Лис 2022',
      ru: 'Июл 2022 – Ноя 2022',
    },
    projects: ['happylemonusa.com', 'Fitness Web Platform'],
    featured: false,
    highlights: {
      en: [
        'Launched an MVP for a wellness/fitness platform, designing a library of 25+ reusable UI components with Next.js and Tailwind.',
        'Redesigned core user dashboard modules for happylemonusa.com, improving mobile responsiveness and cross-browser consistency.',
      ],
      uk: [
        'Запустив MVP для фітнес/велнес платформи, створивши бібліотеку з 25+ перевикористовуваних UI-компонентів на Next.js та Tailwind.',
        'Провів редизайн ключових модулів особистого кабінету для happylemonusa.com з фокусом на мобільну адаптивність.',
      ],
      ru: [
        'Запустил MVP для фитнес/велнес платформы, спроектировав библиотеку из 25+ переиспользуемых UI-компонентов на Next.js и Tailwind.',
        'Провёл редизайн ключевых модулей дашборда для happylemonusa.com, улучшив мобильную адаптивность и кроссбраузерную стабильность.',
      ],
    },
    technologies: ['React', 'Next.js', 'TypeScript', 'Redux', 'Tailwind', 'Styled Components'],
  },
  {
    id: 'aihelps',
    company: 'AIHelps',
    domain: {
      en: 'B2B E-Commerce Product',
      uk: 'B2B E-Commerce Продукт',
      ru: 'B2B E-Commerce Продукт',
    },
    engagement: {
      en: 'Frontend Engineer • Product',
      uk: 'Frontend Engineer • Product',
      ru: 'Frontend Engineer • Product',
    },
    period: {
      en: 'Feb 2021 – May 2022',
      uk: 'Лют 2021 – Тра 2022',
      ru: 'Фев 2021 – Май 2022',
    },
    projects: ['suplery.com'],
    featured: false,
    highlights: {
      en: [
        'Co-developed core frontend modules from scratch for B2B platform suplery.com using React, TypeScript, MobX (MST), and Ant Design (40+ Figma screens).',
        'Onboarded and mentored 3 frontend engineers and established structured Jira code review workflows.',
      ],
      uk: [
        'Співрозробляв ключові фронтенд-модулі з нуля для B2B-платформи suplery.com на React, TypeScript, MobX (MST) та Ant Design (40+ екранів Figma).',
        'Провів онбординг і менторинг 3 фронтенд-інженерів та вибудував процеси код-рев’ю в Jira.',
      ],
      ru: [
        'Соразрабатывал базовые фронтенд-модули с нуля для B2B-платформы suplery.com на React, TypeScript, MobX (MST) и Ant Design (40+ экранов Figma).',
        'Провёл онбординг и менторинг 3 фронтенд-инженеров и выстроил процессы код-ревью в Jira.',
      ],
    },
    technologies: ['React', 'TypeScript', 'MobX (MST)', 'Ant Design', 'Styled Components', 'i18n'],
  },
  {
    id: 'velas',
    company: 'Velas Network AG',
    domain: {
      en: 'Crypto / Blockchain Product',
      uk: 'Crypto / Blockchain Продукт',
      ru: 'Crypto / Blockchain Продукт',
    },
    engagement: {
      en: 'Frontend Developer • Product',
      uk: 'Frontend Developer • Product',
      ru: 'Frontend Developer • Product',
    },
    period: {
      en: 'May 2020 – Oct 2020',
      uk: 'Тра 2020 – Жов 2020',
      ru: 'Май 2020 – Окт 2020',
    },
    projects: ['velas.com'],
    featured: false,
    highlights: {
      en: ['Implemented responsive UI components and product pages for velas.com using React, Redux, and Material UI.'],
      uk: ['Реалізував адаптивні UI-компоненти та продуктові сторінки для velas.com на React, Redux та Material UI.'],
      ru: ['Реализовал адаптивные UI-компоненты и продуктовые страницы для velas.com на React, Redux и Material UI.'],
    },
    technologies: ['React', 'Redux', 'Material UI', 'Styled Components'],
  },
]

export function pickLocalized(text: LocalizedText, locale: SupportedLocale): string {
  return text[locale] ?? text.en
}
