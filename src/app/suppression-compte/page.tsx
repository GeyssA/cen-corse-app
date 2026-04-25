'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function SuppressionComptePage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div
      className={`min-h-screen w-full px-4 py-10 ${
        isLight
          ? 'bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100 text-slate-900'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
      }`}
    >
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <section
          className={`rounded-2xl border p-6 shadow-sm ${
            isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/70'
          }`}
        >
          <h1 className="text-xl font-semibold sm:text-2xl">Suppression de compte</h1>
          <p className={`mt-3 text-sm sm:text-base ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Vous pouvez demander la suppression definitive de votre compte CEN Corse et de vos donnees personnelles.
          </p>

          <ol className={`mt-5 list-decimal space-y-2 pl-5 text-sm sm:text-base ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <li>Envoyez un email depuis l’adresse de votre compte a <a className="font-semibold underline" href="mailto:arnaud.geyssels@cen-corse.org?subject=Demande%20de%20suppression%20de%20compte%20CEN%20Corse">arnaud.geyssels@cen-corse.org</a>.</li>
            <li>Indiquez l’objet: "Demande de suppression de compte CEN Corse".</li>
            <li>Nous traiterons votre demande dans les meilleurs delais.</li>
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:arnaud.geyssels@cen-corse.org?subject=Demande%20de%20suppression%20de%20compte%20CEN%20Corse"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Envoyer ma demande par email
            </a>
            <Link
              href="/"
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-white/20 hover:bg-white/10'
              }`}
            >
              Retour a l’accueil
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
