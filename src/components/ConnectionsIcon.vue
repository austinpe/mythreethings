<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFollowersStore } from '@/stores/followers'
import { Users } from 'lucide-vue-next'

const router = useRouter()
const followers = useFollowersStore()

const badgeCount = computed(() => {
  // For now, show pending requests count
  // Later, we'll add suggestions count too
  return followers.pendingRequests.length
})

function goToConnections() {
  router.push('/connections')
}
</script>

<template>
  <button
    @click="goToConnections"
    class="p-2 rounded-lg hover:bg-muted transition-colors relative"
  >
    <Users class="h-5 w-5 text-muted-foreground" />
    <span
      v-if="badgeCount > 0"
      class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center px-1"
    >
      {{ badgeCount > 9 ? '9+' : badgeCount }}
    </span>
  </button>
</template>
