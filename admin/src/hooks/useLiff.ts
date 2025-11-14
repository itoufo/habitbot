import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { supabase } from '../lib/supabase'

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
      .then(async () => {
        if (liff.isLoggedIn()) {
          const context = liff.getContext()
          const profile = liff.getDecodedIDToken()
          const lineUserId = context?.userId || profile?.sub

          console.log('[LIFF] LINE User ID:', lineUserId)

          // Sign in to Supabase using LINE user ID
          if (lineUserId) {
            await signInToSupabase(lineUserId, profile?.name, profile?.picture)
          }

          setState({
            isLoggedIn: true,
            isReady: true,
            userId: lineUserId || null,
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

  const signInToSupabase = async (lineUserId: string, displayName?: string, pictureUrl?: string) => {
    try {
      // Check if user exists in habit_users table
      const { data: existingUser } = await supabase
        .from('habit_users')
        .select('id')
        .eq('line_id', lineUserId)
        .single()

      if (!existingUser) {
        // Create new user if doesn't exist
        await supabase
          .from('habit_users')
          .insert({
            line_id: lineUserId,
            name: displayName || 'User',
            plan: 'free',
            character_type: 'angel'
          })
        console.log('[LIFF] Created new user in database')
      }

      // Sign in to Supabase Auth using a custom token
      // We'll use the LINE user ID as the email for simplicity
      const email = `${lineUserId}@line.local`
      const password = lineUserId // Using LINE ID as password (hashed by Supabase)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // User doesn't exist in auth, sign them up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              line_id: lineUserId,
              display_name: displayName,
              picture_url: pictureUrl,
            }
          }
        })

        if (signUpError) {
          console.error('[LIFF] Supabase auth sign up error:', signUpError)
        } else {
          console.log('[LIFF] Signed up to Supabase Auth')
        }
      } else {
        console.log('[LIFF] Signed in to Supabase Auth:', authData.user?.id)
      }
    } catch (error) {
      console.error('[LIFF] Error signing in to Supabase:', error)
    }
  }

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
