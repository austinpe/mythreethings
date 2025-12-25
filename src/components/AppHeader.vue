<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import CalendarModal from '@/components/CalendarModal.vue'
import { Calendar, Home } from 'lucide-vue-next'

const props = defineProps({
  currentDateStr: {
    type: String,
    default: ''
  },
  showCalendar: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dateSelect'])

const router = useRouter()
const calendarOpen = ref(false)

function handleDateSelect(dateStr) {
  emit('dateSelect', dateStr)
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Left: Profile switcher -->
        <ProfileSwitcher />

        <!-- Right: Calendar or Home icon -->
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
    </div>
  </header>

  <!-- Calendar Modal -->
  <CalendarModal
    v-model:open="calendarOpen"
    :current-date-str="currentDateStr"
    @select="handleDateSelect"
  />
</template>
