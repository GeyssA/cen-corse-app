'use client'

import { Suspense } from 'react'
import AuthCallbackRunner from '@/components/auth/AuthCallbackRunner'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackRunner fromNativeAppCallback={false} />
    </Suspense>
  )
}
