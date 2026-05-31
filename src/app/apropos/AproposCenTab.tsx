'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { presentationData } from './presentationData'

export default function AproposCenTab() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const expertiseItems = [
    'Suivis faunistiques : herpétologie, ornithologie, écologie terrestre',
    'Gestion de projets européens ou régionaux',
    "Gestion et restauration d'espaces naturels, droit de l'environnement, mesures compensatoires, ORE",
    "Cartographie (SIG) et biostatistiques",
    'Recherche expérimentale : génétique, acoustique, télémétrie, écomorphologie, santé des populations, mortalité',
    "Création d'outils pédagogiques, sensibilisation, conférences"
  ]

  return (
    <div className="w-full">
      {/* Masthead */}
      <header className="mb-10 border-b pb-8 text-left">
        <p
          className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] ${
            isLight ? 'text-emerald-800' : 'text-emerald-400/90'
          }`}
        >
          Association loi 1901 · Agrément protection de l&apos;environnement
        </p>
        <h1
          className={`font-serif text-3xl font-bold leading-tight tracking-tight md:text-[2rem] ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {presentationData.title}
        </h1>
        <p className={`mt-3 max-w-2xl text-base font-medium leading-snug md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          {presentationData.subtitle}
        </p>
        <p className={`mt-4 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          Bastia · 15+ employés
        </p>
      </header>

      {/* Chapô */}
      <div
        className={`mb-10 rounded-2xl border px-5 py-6 md:px-8 md:py-8 ${
          isLight
            ? 'border-slate-200/80 bg-white/80 shadow-sm'
            : 'border-white/10 bg-white/[0.04]'
        }`}
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
        >
          Éditorial
        </p>
        <p
          className={`mt-4 text-base leading-[1.75] first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-4xl first-letter:font-bold first-letter:leading-none md:text-lg ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Le Conservatoire d&apos;espaces naturels Corse (CEN Corse) est une association à but non lucratif. Créé en{' '}
          <strong className={isLight ? 'text-slate-900' : 'text-white'}>1972</strong> à l&apos;initiative de naturalistes
          locaux, il œuvre pour préserver le patrimoine naturel et la biodiversité de l&apos;île. Siège à{' '}
          <strong>Bastia</strong>, la structure intervient sur l&apos;ensemble de l&apos;île et fédère des expertises
          complémentaires au service d&apos;une conservation fondée sur la donnée et le terrain.
        </p>
      </div>

      {/* Expertises */}
      <section className="mb-12">
        <h2
          className={`mb-6 border-l-4 pl-4 font-serif text-xl font-bold md:text-2xl ${
            isLight ? 'border-emerald-600 text-slate-900' : 'border-emerald-500 text-white'
          }`}
        >
          Champs d&apos;intervention
        </h2>
        <ul className="space-y-0">
          {expertiseItems.map((line, i) => (
            <li
              key={i}
              className={`flex gap-4 border-b py-4 last:border-b-0 ${
                isLight ? 'border-slate-200/70' : 'border-white/10'
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-200'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-sm leading-relaxed md:text-base ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {line}
              </span>
            </li>
          ))}
        </ul>
        <p className={`mt-6 text-sm italic ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          Cette polyvalence permet d&apos;adresser une large gamme d&apos;enjeux environnementaux sur l&apos;île.
        </p>
      </section>

      {/* Mission — citation */}
      <section className="mb-12">
        <h2
          className={`mb-4 font-serif text-xl font-bold md:text-2xl ${isLight ? 'text-slate-900' : 'text-white'}`}
        >
          Mission
        </h2>
        <blockquote
          className={`relative border-l-4 pl-5 py-1 font-serif text-lg italic leading-relaxed md:text-xl ${
            isLight ? 'border-teal-600 text-slate-800' : 'border-teal-500/80 text-slate-200'
          }`}
        >
          {presentationData.mission}
        </blockquote>
      </section>

      {/* Valeurs */}
      <section className="mb-12">
        <h2
          className={`mb-5 font-serif text-xl font-bold md:text-2xl ${isLight ? 'text-slate-900' : 'text-white'}`}
        >
          Valeurs
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {presentationData.values.map((value) => (
            <div
              key={value}
              className={`rounded-xl border px-4 py-3 text-center text-sm font-medium md:text-base ${
                isLight
                  ? 'border-slate-200 bg-slate-50/90 text-slate-800'
                  : 'border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              {value}
            </div>
          ))}
        </div>
      </section>

      {/* Activités */}
      <section className="mb-12">
        <h2
          className={`mb-5 font-serif text-xl font-bold md:text-2xl ${isLight ? 'text-slate-900' : 'text-white'}`}
        >
          Axes d&apos;activité
        </h2>
        <ul className="space-y-3">
          {presentationData.activities.map((activity) => (
            <li
              key={activity}
              className={`flex items-start gap-3 text-sm leading-relaxed md:text-base ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
              <span>{activity}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section
        className={`rounded-2xl border p-6 md:p-8 ${
          isLight ? 'border-slate-200 bg-gradient-to-br from-white to-slate-50' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <h2 className={`mb-6 font-serif text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Nous contacter
        </h2>
        <div className="space-y-4">
          {presentationData.addresses.map((address) => (
            <a
              key={address}
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-3 text-sm underline-offset-2 transition-colors hover:underline ${
                isLight ? 'text-slate-700 hover:text-emerald-800' : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              <span className="mt-0.5 text-base">📍</span>
              {address}
            </a>
          ))}
          <a
            href={`tel:${presentationData.phone.replace(/\s/g, '')}`}
            className={`flex items-center gap-3 text-sm ${
              isLight ? 'text-slate-700 hover:text-emerald-800' : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            <span>☎</span> {presentationData.phone}
          </a>
          <a
            href={`mailto:${presentationData.email}`}
            className={`flex items-center gap-3 text-sm break-all ${
              isLight ? 'text-slate-700 hover:text-emerald-800' : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            <span>✉</span> {presentationData.email}
          </a>
          <a
            href={`https://${presentationData.website.replace(/^https?:\/\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 text-sm underline-offset-2 transition-colors hover:underline ${
              isLight ? 'text-slate-700 hover:text-emerald-800' : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            <span className="text-base" aria-hidden>
              🌐
            </span>
            {presentationData.website}
          </a>
        </div>
      </section>
    </div>
  )
}
