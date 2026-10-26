'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function ConfidentialitePage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const muted = isLight ? 'text-slate-700' : 'text-slate-300'
  const card = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-900/70'

  return (
    <div
      className={`min-h-screen w-full px-4 py-10 ${
        isLight
          ? 'bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-100 text-slate-900'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
      }`}
    >
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <section className={`rounded-2xl border p-6 shadow-sm ${card}`}>
          <h1 className="text-xl font-semibold sm:text-2xl">Politique de confidentialité</h1>
          <p className={`mt-2 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Application CEN Corse — Dernière mise à jour : octobre 2026
          </p>
          <p className={`mt-4 text-sm sm:text-base ${muted}`}>
            La présente politique décrit comment le Conservatoire d&apos;espaces naturels de Corse
            (« CEN Corse », « nous ») collecte et utilise les données personnelles dans le cadre de
            l&apos;application mobile et web CEN Corse.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">1. Responsable du traitement</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Conservatoire d&apos;espaces naturels de Corse
            <br />
            Site :{' '}
            <a className="underline font-medium" href="https://www.cen-corse.org" target="_blank" rel="noreferrer">
              www.cen-corse.org
            </a>
            <br />
            Contact :{' '}
            <a className="underline font-medium" href="mailto:contact@cen-corse.org">
              contact@cen-corse.org
            </a>
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">2. Données collectées</h2>
          <p className={`text-sm sm:text-base ${muted}`}>Selon votre utilisation, nous pouvons traiter :</p>
          <ul className={`list-disc space-y-2 pl-5 text-sm sm:text-base ${muted}`}>
            <li>
              <strong>Compte</strong> : adresse e-mail, nom d&apos;affichage, identifiants liés à la
              connexion (e-mail/mot de passe, Google ou Apple).
            </li>
            <li>
              <strong>Observations naturalistes</strong> : espèces, dates, protocoles, remarques,
              photos associées, informations de site.
            </li>
            <li>
              <strong>Localisation</strong> : position GPS lorsque vous enregistrez une observation
              ou un site (avec votre autorisation).
            </li>
            <li>
              <strong>Médias</strong> : photos prises ou choisies pour illustrer une observation ou
              un site (appareil photo / photothèque, avec votre autorisation).
            </li>
            <li>
              <strong>Données techniques</strong> : informations nécessaires au fonctionnement de
              l&apos;app (session, synchronisation hors ligne éventuelle).
            </li>
          </ul>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">3. Finalités</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm sm:text-base ${muted}`}>
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Enregistrer, afficher et synchroniser vos observations et sites</li>
            <li>Contribuer aux missions de connaissance et de conservation du CEN Corse</li>
            <li>Assurer la sécurité, la maintenance et l&apos;amélioration de l&apos;application</li>
            <li>Répondre à vos demandes (support, suppression de compte)</li>
          </ul>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">4. Base légale</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Le traitement repose principalement sur l&apos;exécution du service que vous demandez
            (compte et saisie d&apos;observations), votre consentement pour l&apos;accès à la
            localisation, à l&apos;appareil photo ou à la photothèque, et l&apos;intérêt légitime du
            CEN Corse pour la conservation de la biodiversité et la sécurité du service.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">5. Hébergement et sous-traitants</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Les données de l&apos;application sont hébergées via des prestataires techniques
            (notamment Supabase pour l&apos;authentification et la base de données, et des services
            d&apos;hébergement web). Ces prestataires agissent selon nos instructions et des
            mesures de sécurité appropriées.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">6. Conservation</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Les données de compte et d&apos;observations sont conservées tant que votre compte est
            actif et que cela est nécessaire aux finalités décrites, ou pour respecter des
            obligations légales. En cas de demande de suppression de compte, nous procéderons à la
            suppression ou à l&apos;anonymisation des données personnelles dans un délai
            raisonnable, sous réserve d&apos;éventuelles obligations de conservation.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">7. Partage</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Nous ne vendons pas vos données personnelles. Elles peuvent être accessibles aux
            équipes du CEN Corse dans le cadre des missions de l&apos;association, et à des
            prestataires techniques strictement nécessaires au fonctionnement de l&apos;app. Elles
            ne sont communiquées à des tiers que si la loi l&apos;exige ou avec votre accord.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">8. Vos droits</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité, dans les
            conditions prévues par la réglementation. Pour exercer ces droits :{' '}
            <a className="underline font-medium" href="mailto:contact@cen-corse.org">
              contact@cen-corse.org
            </a>
            .
          </p>
          <p className={`text-sm sm:text-base ${muted}`}>
            Pour demander la suppression de votre compte :{' '}
            <Link href="/suppression-compte" className="underline font-medium">
              page Suppression de compte
            </Link>
            .
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">9. Permissions de l&apos;appareil</h2>
          <ul className={`list-disc space-y-2 pl-5 text-sm sm:text-base ${muted}`}>
            <li>Localisation : uniquement pour géolocaliser observations et sites</li>
            <li>Appareil photo / photothèque : uniquement pour joindre des photos</li>
            <li>Microphone : uniquement si la saisie vocale est utilisée</li>
          </ul>
          <p className={`text-sm sm:text-base ${muted}`}>
            Vous pouvez retirer ces autorisations à tout moment dans les réglages de votre
            téléphone.
          </p>
        </section>

        <section className={`rounded-2xl border p-6 shadow-sm space-y-3 ${card}`}>
          <h2 className="text-lg font-semibold">10. Contact</h2>
          <p className={`text-sm sm:text-base ${muted}`}>
            Pour toute question relative à cette politique :{' '}
            <a className="underline font-medium" href="mailto:contact@cen-corse.org">
              contact@cen-corse.org
            </a>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/suppression-compte"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              Suppression de compte
            </Link>
            <Link
              href="/"
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-white/20 hover:bg-white/10'
              }`}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
