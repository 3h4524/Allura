import React, { useEffect, useMemo } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from './i18n.js'

export function LanguageProvider({ children }) {
  useEffect(() => { document.documentElement.lang = i18n.language; const onChange = lng => { localStorage.setItem('allura:language', lng); document.documentElement.lang = lng }; i18n.on('languageChanged', onChange); return () => i18n.off('languageChanged', onChange) }, [])
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export function useLanguage() {
  const { t, i18n: instance } = useTranslation()
  const language = instance.language
  const setLanguage = value => instance.changeLanguage(value === 'en' ? 'en' : 'vi')
  const copy = useMemo(() => ({
    nav: { home: t('nav.home'), product: t('nav.product'), guide: t('nav.guide'), setup: t('nav.setup'), music: t('nav.music'), support: t('nav.support') },
    login: t('common.login'), create: t('common.create'), cart: t('common.cart'), menu: t('common.menu'), close: t('common.close'), living: t('common.living'), footer: t('common.footer'), language: t('common.language'),
    hero: <>{t('home.heroLine1')}<br /><em>{t('home.heroLine2')}</em></>, heroText: t('home.heroText'), discover: t('home.discover'), memory: <>{t('home.memoryLine1')} <em>{t('home.memoryLine2')}</em></>, memoryText: t('home.memoryText'), features: [0, 1, 2].map(index => [t(`home.features.${index}.0`), t(`home.features.${index}.1`)]), quote: <>{t('home.quoteLine1')}<br />{t('home.quoteLine2')}</>,
  }), [t, language])
  return { language, setLanguage, t, copy }
}
