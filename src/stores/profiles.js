import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import pb from '@/lib/pocketbase'
import { useTheme } from '@/composables/useTheme'

// Generate a random share code (e.g., "ABC-123-XYZ")
function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars like 0/O, 1/I
  const segments = []
  for (let s = 0; s < 3; s++) {
    let segment = ''
    for (let i = 0; i < 3; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

// Generate a management code (e.g., "MGR-ABCD-1234") - different format to distinguish
function generateManagementCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MGR-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  code += '-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref([])
  const activeProfileId = ref(localStorage.getItem('activeProfileId') || null)
  const loading = ref(false)

  // Get theme composable for applying profile settings
  const theme = useTheme()

  const activeProfile = computed(() => {
    return profiles.value.find(p => p.id === activeProfileId.value) || profiles.value[0] || null
  })

  const selfProfile = computed(() => {
    return profiles.value.find(p => !p.is_managed) || null
  })

  const managedProfiles = computed(() => {
    return profiles.value.filter(p => p.is_managed)
  })

  // Apply theme when active profile changes
  watch(activeProfile, (profile) => {
    if (profile?.settings) {
      theme.loadFromProfile(profile.settings)
    }
  }, { immediate: true })

  async function fetchProfiles() {
    if (!pb.authStore.isValid) return

    loading.value = true
    try {
      // Get all profiles this user manages
      const managerRecords = await pb.collection('profile_managers').getFullList({
        filter: `user = "${pb.authStore.record.id}"`,
        expand: 'profile',
        requestKey: null // Disable auto-cancellation
      })

      profiles.value = managerRecords
        .map(pm => pm.expand?.profile)
        .filter(Boolean)

      // Ensure self profile exists
      const hasSelf = profiles.value.some(p => !p.is_managed)
      if (!hasSelf) {
        await createSelfProfile()
      }

      // Ensure all profiles have share codes and management codes (lazy migration)
      await ensureProfileCodes()

      // Set active profile to saved one or default to self
      if (!activeProfileId.value || !profiles.value.find(p => p.id === activeProfileId.value)) {
        const self = profiles.value.find(p => !p.is_managed)
        if (self) {
          setActiveProfile(self.id)
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function createSelfProfile() {
    if (!pb.authStore.isValid) return

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

    profiles.value.push(profile)
  }

  async function ensureProfileCodes() {
    // Generate share codes and management codes for any profiles missing them
    for (let i = 0; i < profiles.value.length; i++) {
      const profile = profiles.value[i]
      const updates = {}

      if (!profile.share_code) {
        updates.share_code = generateShareCode()
      }
      if (!profile.management_code) {
        updates.management_code = generateManagementCode()
      }

      if (Object.keys(updates).length > 0) {
        const updated = await pb.collection('profiles').update(profile.id, updates)
        profiles.value[i] = updated
      }
    }
  }

  function setActiveProfile(profileId) {
    activeProfileId.value = profileId
    localStorage.setItem('activeProfileId', profileId)
  }

  async function createManagedProfile(name) {
    if (!pb.authStore.isValid) return null

    const profile = await pb.collection('profiles').create({
      name,
      is_managed: true,
      created_by: pb.authStore.record.id,
      share_code: generateShareCode(),
      management_code: generateManagementCode()
    })

    await pb.collection('profile_managers').create({
      profile: profile.id,
      user: pb.authStore.record.id
    })

    await fetchProfiles()
    return profile
  }

  async function updateProfile(profileId, data) {
    const updated = await pb.collection('profiles').update(profileId, data)
    const index = profiles.value.findIndex(p => p.id === profileId)
    if (index !== -1) {
      profiles.value[index] = updated
    }
    return updated
  }

  async function updateProfileSettings(profileId, settings) {
    // Merge with existing settings
    const profile = profiles.value.find(p => p.id === profileId)
    const currentSettings = profile?.settings || {}
    const newSettings = { ...currentSettings, ...settings }

    const updated = await updateProfile(profileId, { settings: newSettings })

    // If this is the active profile, apply the theme immediately
    if (profileId === activeProfileId.value) {
      theme.loadFromProfile(newSettings)
    }

    return updated
  }

  async function getProfileManagers(profileId) {
    const managers = await pb.collection('profile_managers').getFullList({
      filter: `profile = "${profileId}"`,
      expand: 'user'
    })
    return managers.map(m => ({
      id: m.id,
      userId: m.user,
      name: m.expand?.user?.name || 'Unknown'
    }))
  }

  async function inviteManager(profileId, email) {
    // Find user by email
    const users = await pb.collection('users').getList(1, 1, {
      filter: `email = "${email}"`
    })

    if (users.items.length === 0) {
      throw new Error('No user found with that email')
    }

    const user = users.items[0]

    // Check if already a manager
    const existing = await pb.collection('profile_managers').getList(1, 1, {
      filter: `profile = "${profileId}" && user = "${user.id}"`
    })

    if (existing.items.length > 0) {
      throw new Error('This user is already a manager')
    }

    // Add as manager
    await pb.collection('profile_managers').create({
      profile: profileId,
      user: user.id
    })

    return user
  }

  async function joinByManagementCode(managementCode) {
    if (!pb.authStore.isValid) return null

    // Find profile with this management code
    const profileResults = await pb.collection('profiles').getList(1, 1, {
      filter: `management_code = "${managementCode.trim().toUpperCase()}"`
    })

    if (profileResults.items.length === 0) {
      throw new Error('No profile found with that management code')
    }

    const profile = profileResults.items[0]

    // Check if already a manager
    const existing = await pb.collection('profile_managers').getList(1, 1, {
      filter: `profile = "${profile.id}" && user = "${pb.authStore.record.id}"`
    })

    if (existing.items.length > 0) {
      throw new Error('You are already a manager of this profile')
    }

    // Add as manager
    await pb.collection('profile_managers').create({
      profile: profile.id,
      user: pb.authStore.record.id
    })

    // Refresh profiles list
    await fetchProfiles()

    return profile
  }

  async function leaveProfile(profileId) {
    if (!pb.authStore.isValid) return

    // Find the manager record for this user
    const managers = await pb.collection('profile_managers').getFullList({
      filter: `profile = "${profileId}"`
    })

    // Check if this is the last manager
    if (managers.length <= 1) {
      throw new Error('Cannot leave - you are the only manager')
    }

    // Find and delete own manager record
    const myRecord = managers.find(m => m.user === pb.authStore.record.id)
    if (myRecord) {
      await pb.collection('profile_managers').delete(myRecord.id)
    }

    // If leaving active profile, switch to self
    if (activeProfileId.value === profileId) {
      const self = profiles.value.find(p => !p.is_managed && p.id !== profileId)
      if (self) {
        setActiveProfile(self.id)
      }
    }

    await fetchProfiles()
  }

  return {
    profiles,
    activeProfileId,
    activeProfile,
    selfProfile,
    managedProfiles,
    loading,
    fetchProfiles,
    setActiveProfile,
    createManagedProfile,
    updateProfile,
    updateProfileSettings,
    getProfileManagers,
    inviteManager,
    joinByManagementCode,
    leaveProfile
  }
})
