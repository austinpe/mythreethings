<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useProfilesStore } from '@/stores/profiles'
import pb from '@/lib/pocketbase'

const theme = useTheme()
const profiles = useProfilesStore()
const appReady = ref(false)

onMounted(async () => {
  // If authenticated, load profiles and apply theme from active profile
  if (pb.authStore.isValid) {
    await profiles.fetchProfiles()
    // Theme is applied automatically via the watch in profiles store
  }
  appReady.value = true
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="!appReady" class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-muted-foreground">Loading...</div>
  </div>

  <!-- Main app -->
  <div v-else class="min-h-screen bg-background text-foreground">
    <RouterView />
  </div>
</template>
