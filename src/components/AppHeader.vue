<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import CalendarModal from '@/components/CalendarModal.vue'
import ConnectionsIcon from '@/components/ConnectionsIcon.vue'
import { useFollowersStore } from '@/stores/followers'
import { Calendar, Home, ChevronLeft } from 'lucide-vue-next'

const props = defineProps({
  currentDateStr: {
    type: String,
    default: ''
  },
  showCalendar: {
    type: Boolean,
    default: true
  },
  showConnections: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dateSelect'])

const router = useRouter()
const followers = useFollowersStore()
const calendarOpen = ref(false)

function handleDateSelect(dateStr) {
  emit('dateSelect', dateStr)
}

function goHome() {
  router.push('/')
}

function exitViewingMode() {
  followers.clearViewingProfile()
  router.push('/connections')
}
</script>

<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Viewing another profile mode -->
        <template v-if="followers.isViewingOther">
          <!-- Left: Back button with profile name -->
          <button
            @click="exitViewingMode"
            class="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ChevronLeft class="h-5 w-5" />
            <span>{{ followers.viewingProfile?.name }}'s Things</span>
          </button>

          <!-- Right: Calendar only -->
          <button
            v-if="showCalendar"
            @click="calendarOpen = true"
            class="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Calendar class="h-5 w-5 text-muted-foreground" />
          </button>
        </template>

        <!-- Normal mode -->
        <template v-else>
          <!-- Left: Profile switcher -->
          <ProfileSwitcher />

          <!-- Right: Icons -->
          <div class="flex items-center gap-1">
            <ConnectionsIcon v-if="showConnections" />

            <button
              v-if="showCalendar"
              @click="calendarOpen = true"
              class="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Calendar class="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              v-else
              @click="goHome"
              class="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Home class="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </header>

  <!-- Calendar Modal -->
  <CalendarModal
    v-model:open="calendarOpen"
    :current-date-str="currentDateStr"
    @select="handleDateSelect"
  />
</template>
