'use client'

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ok, votre mail a été confirmé</h1>
        <p className="text-gray-600 mb-6">Vous pouvez maintenant vous connecter à votre espace personnel.</p>
        <a href="/auth" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Se connecter</a>
      </div>
    </div>
  )
} 