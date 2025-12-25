import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'

export const useProfilesStore = defineStore('profiles', () => {
  const profiles = ref([])
  const activeProfileId = ref(localStorage.getItem('activeProfileId') || null)
  const loading = ref(false)

  const activeProfile = computed(() => {
    return profiles.value.find(p => p.id === activeProfileId.value) || profiles.value[0] || null
  })

  const selfProfile = computed(() => {
    return profiles.value.find(p => !p.is_managed) || null
  })

  const managedProfiles = computed(() => {
    return profiles.value.filter(p => p.is_managed)
  })

  async function fetchProfiles() {
    if (!pb.authStore.isValid) return

    loading.value = true
    try {
      // Get all profiles this user manages
      const managerRecords = await pb.collection('profile_managers').getFullList({
        filter: `user = "${pb.authStore.record.id}"`,
        expand: 'profile'
      })

      profiles.value = managerRecords
        .map(pm => pm.expand?.profile)
        .filter(Boolean)

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

  function setActiveProfile(profileId) {
    activeProfileId.value = profileId
    localStorage.setItem('activeProfileId', profileId)
  }

  async function createManagedProfile(name) {
    if (!pb.authStore.isValid) return null

    const profile = await pb.collection('profiles').create({
      name,
      is_managed: true,
      created_by: pb.authStore.record.id
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
    updateProfile
  }
})
