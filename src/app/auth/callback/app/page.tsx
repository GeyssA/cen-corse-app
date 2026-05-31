'use client'

import { Suspense } from 'react'
import AuthCallbackRunner from '@/components/auth/AuthCallbackRunner'

/** Callback OAuth réservé à l’app Android : après Google, renvoie vers `cencorse://` si le flux s’est terminé dans Chrome. */
export default function AuthCallbackAppPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackRunner fromNativeAppCallback />
    </Suspense>
  )
}
