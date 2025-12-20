import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  // 'as-needed' hides the prefix for the default locale (en)
  // but shows it for other locales (e.g., /hi/dashboard)
  localePrefix: 'as-needed'
});

export type Locale = (typeof routing.locales)[number];
