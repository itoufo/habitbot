import { useEffect, useState } from 'react'
import liff from '@line/liff'

interface LiffState {
  isLoggedIn: boolean
  isReady: boolean
  userId: string | null
  displayName: string | null
  pictureUrl: string | null
  error: Error | null
}

export const useLiff = (liffId: string) => {
  const [state, setState] = useState<LiffState>({
    isLoggedIn: false,
    isReady: false,
    userId: null,
    displayName: null,
    pictureUrl: null,
    error: null,
  })

  useEffect(() => {
    liff
      .init({ liffId })
      .then(() => {
        if (liff.isLoggedIn()) {
          const profile = liff.getDecodedIDToken()
          setState({
            isLoggedIn: true,
            isReady: true,
            userId: profile?.sub || null,
            displayName: profile?.name || null,
            pictureUrl: profile?.picture || null,
            error: null,
          })
        } else {
          liff.login()
        }
      })
      .catch((error) => {
        console.error('LIFF Initialization failed', error)
        setState((prev) => ({ ...prev, isReady: true, error }))
      })
  }, [liffId])

  const logout = () => {
    if (liff.isLoggedIn()) {
      liff.logout()
      setState({
        isLoggedIn: false,
        isReady: true,
        userId: null,
        displayName: null,
        pictureUrl: null,
        error: null,
      })
    }
  }

  const closeLiff = () => {
    liff.closeWindow()
  }

  return { ...state, logout, closeLiff, liff }
}
