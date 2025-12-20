"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
    const t = useTranslations('locale');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        // Remove current locale prefix if present
        const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/|$)`);
        const pathnameWithoutLocale = pathname.replace(localePattern, '$2') || '/';

        // Build new path with locale prefix (or without for default locale)
        const newPath = newLocale === routing.defaultLocale
            ? pathnameWithoutLocale
            : `/${newLocale}${pathnameWithoutLocale === '/' ? '' : pathnameWithoutLocale}`;

        router.push(newPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">{t('switchLanguage')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLocaleChange('en')}
                    className={locale === 'en' ? 'bg-accent' : ''}
                >
                    {t('english')}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLocaleChange('hi')}
                    className={locale === 'hi' ? 'bg-accent' : ''}
                >
                    {t('hindi')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
