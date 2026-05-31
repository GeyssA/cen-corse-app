'use client'

import { Capacitor } from '@capacitor/core'
import { useTheme } from '@/contexts/ThemeContext'

export default function AproposSoutenirTab() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const handleContactClick = (subject: string) => {
    const email = 'contact@cen-corse.org'
    const body = encodeURIComponent(`Bonjour,\n\nJe souhaite ${subject.toLowerCase()}.\n\nCordialement,`)
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`)
  }

  const downloadActivityReport = async () => {
    const url = "/Rapport d'activité 2024_compressed.pdf"
    const filename = "Rapport d'activité 2024_compressed.pdf"

    if (Capacitor.isNativePlatform()) {
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
        return
      } catch {
        // fallback web download
      }
    }

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
    } catch {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const divider = isLight ? 'border-slate-200' : 'border-white/15'

  return (
    <div className="w-full">
      <header className="mb-10 border-b pb-8 text-left">
        <p
          className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] ${
            isLight ? 'text-emerald-800' : 'text-emerald-400/90'
          }`}
        >
          Engagement &amp; transparence
        </p>
        <h1
          className={`font-serif text-3xl font-bold leading-tight tracking-tight md:text-[2rem] ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          Soutenir le CEN Corse
        </h1>
        <p className={`mt-3 max-w-2xl text-base leading-relaxed md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Rejoignez la protection du patrimoine naturel insulaire : adhésion, lecture des bilans, dons et partenariats.
        </p>
      </header>

      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] ${
            isLight
              ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm'
              : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-900/10'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                  isLight ? 'bg-emerald-100' : 'bg-emerald-500/25'
                }`}
              >
                <svg
                  className={`h-6 w-6 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className={`font-serif text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Devenez adhérent
                </h2>
                <p className={`mt-1 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Rejoignez la communauté et participez aux instances de l&apos;association.
                </p>
              </div>
            </div>
            <a
              href="https://www.helloasso.com/associations/conservatoire-d-espaces-naturels-de-corse-cen-corse/adhesions/campagne-adhesion-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Adhérer
            </a>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] ${
            isLight
              ? 'border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm'
              : 'border-white/10 bg-white/[0.04]'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                  isLight ? 'bg-slate-200' : 'bg-slate-600/40'
                }`}
              >
                <svg
                  className={`h-6 w-6 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className={`font-serif text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Rapport d&apos;activité
                </h2>
                <p className={`mt-1 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Bilan 2024 : actions sur le terrain et résultats scientifiques.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void downloadActivityReport()}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Télécharger
            </button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className={`mb-2 font-serif text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Nous écrire
        </h2>
        <p className={`mb-6 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Choisissez un motif : un message prérempli s&apos;ouvrira dans votre messagerie.
        </p>

        <div className={`divide-y ${divider}`}>
          <button
            type="button"
            onClick={() => handleContactClick('Faire un don (pécunier ou matériel)')}
            className="w-full py-4 text-left transition hover:opacity-85"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  isLight ? 'bg-slate-100' : 'bg-white/10'
                }`}
              >
                <svg
                  className={`h-5 w-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Faire un don (pécunier ou matériel)
                </h3>
                <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Soutien financier ou matériel aux programmes de conservation.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleContactClick('Confier la gestion de votre terrain au CEN Corse')}
            className="w-full py-4 text-left transition hover:opacity-85"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  isLight ? 'bg-slate-100' : 'bg-white/10'
                }`}
              >
                <svg
                  className={`h-5 w-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Confier la gestion de votre terrain
                </h3>
                <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Accompagnement technique et conservation des milieux.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleContactClick('Collaborer ou devenir mécène')}
            className="w-full py-4 text-left transition hover:opacity-85"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  isLight ? 'bg-slate-100' : 'bg-white/10'
                }`}
              >
                <svg
                  className={`h-5 w-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Collaborer ou devenir mécène
                </h3>
                <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Partenariats institutionnels et soutiens ciblés.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleContactClick("Intégrer le conseil d'administration")}
            className="w-full py-4 text-left transition hover:opacity-85"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  isLight ? 'bg-slate-100' : 'bg-white/10'
                }`}
              >
                <svg
                  className={`h-5 w-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Intégrer le conseil d&apos;administration
                </h3>
                <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Gouvernance associative et représentation des adhérents.
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <div
        className={`mt-10 rounded-2xl border p-5 ${
          isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <h3 className={`mb-3 font-serif text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Contact direct
        </h3>
        <div className="space-y-2 text-sm">
          <a
            href="mailto:contact@cen-corse.org"
            className={`flex items-center gap-2 ${isLight ? 'text-emerald-800 hover:underline' : 'text-emerald-400 hover:underline'}`}
          >
            contact@cen-corse.org
          </a>
          <a
            href="tel:0495327163"
            className={`flex items-center gap-2 ${isLight ? 'text-slate-700 hover:underline' : 'text-slate-300 hover:underline'}`}
          >
            04 95 32 71 63
          </a>
        </div>
      </div>
    </div>
  )
}
