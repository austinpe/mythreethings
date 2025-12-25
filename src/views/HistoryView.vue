<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import { ChevronLeft, ChevronRight, Home } from 'lucide-vue-next'

const router = useRouter()
const profiles = useProfilesStore()
const entries = useEntriesStore()

const currentDate = ref(new Date())
const monthEntries = ref([])
const loading = ref(false)

const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []

  // Add empty slots for days before the first of the month
  const startPadding = firstDay.getDay()
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }

  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entry = monthEntries.value.find(e => e.date === dateStr)
    days.push({
      day: d,
      date: dateStr,
      hasEntry: !!entry,
      isToday: isToday(year, month, d)
    })
  }

  return days
})

function isToday(year, month, day) {
  const today = new Date()
  return today.getFullYear() === year &&
         today.getMonth() === month &&
         today.getDate() === day
}

async function loadMonth() {
  if (!profiles.activeProfile) return

  loading.value = true
  try {
    monthEntries.value = await entries.getEntriesForMonth(
      profiles.activeProfile.id,
      currentDate.value.getFullYear(),
      currentDate.value.getMonth()
    )
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

function selectDay(dateStr) {
  router.push(`/entry/${dateStr}`)
}

onMounted(async () => {
  if (!profiles.profiles.length) {
    await profiles.fetchProfiles()
  }
  await loadMonth()
})

watch(() => profiles.activeProfileId, loadMonth)
watch(currentDate, loadMonth)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" @click="router.push('/')">
          <Home class="h-5 w-5" />
        </Button>
        <ProfileSwitcher />
        <div class="w-10" />
      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg">
      <Card>
        <CardContent class="pt-6">
          <!-- Month navigation -->
          <div class="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" @click="prevMonth">
              <ChevronLeft class="h-5 w-5" />
            </Button>
            <h2 class="text-lg font-semibold">{{ currentMonth }}</h2>
            <Button variant="ghost" size="icon" @click="nextMonth">
              <ChevronRight class="h-5 w-5" />
            </Button>
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-1 text-center">
            <!-- Day headers -->
            <div v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="day" class="text-xs text-muted-foreground py-2">
              {{ day }}
            </div>

            <!-- Calendar days -->
            <template v-for="(day, index) in calendarDays" :key="index">
              <div v-if="day === null" class="aspect-square" />
              <button
                v-else
                @click="selectDay(day.date)"
                class="aspect-square flex items-center justify-center rounded-full text-sm transition-colors"
                :class="{
                  'bg-primary text-primary-foreground': day.isToday,
                  'bg-primary/20': day.hasEntry && !day.isToday,
                  'hover:bg-muted': !day.isToday
                }"
              >
                {{ day.day }}
              </button>
            </template>
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="text-center text-sm text-muted-foreground mt-4">
            Loading...
          </div>

          <!-- Legend -->
          <div class="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full bg-primary" />
              <span>Today</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full bg-primary/20" />
              <span>Has entry</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
