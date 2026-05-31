/**
 * Affiché instantanément par Next.js avant le JS — évite un flash « page web ».
 */
export default function AuthCallbackAppLoading() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#020617] px-6">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 40%)
          `,
        }}
      />
      <div className="relative z-10 flex max-w-sm flex-col items-center gap-8">
        <div
          className="flex items-center justify-center rounded-md bg-white px-4 py-2 shadow-lg"
          style={{
            width: 'clamp(120px, 30vw, 172px)',
            height: 'clamp(34px, 9vw, 44px)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Logo_CENCorse.png"
            alt=""
            className="h-9 w-auto max-w-[160px] object-contain"
            width={160}
            height={36}
          />
        </div>
        <p className="text-center text-[13px] font-medium tracking-wide text-slate-400">
          Connexion sécurisée en cours…
        </p>
        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-sm bg-sky-400/90 shadow-md shadow-sky-500/30 animate-callback-cube"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
