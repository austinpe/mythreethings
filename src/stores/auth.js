import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'

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
    // Create user account
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name
    })
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
      expand: 'profile'
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
        created_by: pb.authStore.record.id
      })

      await pb.collection('profile_managers').create({
        profile: profile.id,
        user: pb.authStore.record.id
      })
    }
  }

  // Check auth on store init
  if (pb.authStore.isValid) {
    ensureSelfProfile()
  }

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
