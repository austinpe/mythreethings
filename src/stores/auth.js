import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'
import { generateShareCode, generateManagementCode } from '@/lib/codeGenerator'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(pb.authStore.record)
  const token = ref(pb.authStore.token)

  const isAuthenticated = computed(() => pb.authStore.isValid)

  // Listen for auth state changes
  pb.authStore.onChange((newToken, newRecord) => {
    token.value = newToken
    user.value = newRecord
  })

  async function login(email, password) {
    const authData = await pb.collection('users').authWithPassword(email, password)
    await ensureSelfProfile()
    return authData
  }

  async function register(email, password, name) {
    try {
      // Create user account
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name
      })
    } catch (err) {
      // Extract detailed error message from PocketBase response
      // PocketBase SDK puts field errors in err.data.data or err.response.data
      const fieldErrors = err.data?.data || err.response?.data
      if (fieldErrors && typeof fieldErrors === 'object') {
        const messages = []
        for (const [field, fieldError] of Object.entries(fieldErrors)) {
          if (fieldError?.message) {
            messages.push(`${field}: ${fieldError.message}`)
          }
        }
        if (messages.length > 0) {
          throw new Error(messages.join(', '))
        }
      }
      // Fallback to the error message
      throw new Error(err.message || 'Registration failed')
    }
    // Then log them in
    return await login(email, password)
  }

  function logout() {
    pb.authStore.clear()
  }

  async function ensureSelfProfile() {
    if (!pb.authStore.isValid) return

    // Check if user already has a self profile
    const existingProfiles = await pb.collection('profile_managers').getList(1, 1, {
      filter: `user = "${pb.authStore.record.id}"`,
      expand: 'profile',
      requestKey: null // Disable auto-cancellation
    })

    // Find a self (non-managed) profile
    const selfProfile = existingProfiles.items.find(
      pm => pm.expand?.profile && !pm.expand.profile.is_managed
    )

    if (!selfProfile) {
      // Create self profile and add as manager
      const profile = await pb.collection('profiles').create({
        name: pb.authStore.record.name || pb.authStore.record.email.split('@')[0],
        is_managed: false,
        created_by: pb.authStore.record.id,
        share_code: generateShareCode(),
        management_code: generateManagementCode()
      })

      await pb.collection('profile_managers').create({
        profile: profile.id,
        user: pb.authStore.record.id
      })
    }
  }

  // Note: Don't call ensureSelfProfile on init - let profiles store handle it
  // to avoid auto-cancellation conflicts

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    ensureSelfProfile
  }
})
