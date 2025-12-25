<script setup>
import { ref, computed, watch } from 'vue'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { useFollowersStore } from '@/stores/followers'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  currentDateStr: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:open', 'select'])

const profiles = useProfilesStore()
const entries = useEntriesStore()
const followers = useFollowersStore()

// The profile we're viewing entries for (own or followed)
const targetProfile = computed(() => {
  if (followers.isViewingOther) {
    return followers.viewingProfile
  }
  return profiles.activeProfile
})

const currentDate = ref(new Date())
const monthEntries = ref([])
const loading = ref(true)
const initialized = ref(false)

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entry = monthEntries.value.find(e => e.date && e.date.startsWith(dateStr))
    const dayDate = new Date(year, month, d)
    days.push({
      day: d,
      date: dateStr,
      hasEntry: !!entry,
      isToday: isToday(year, month, d),
      isSelected: dateStr === props.currentDateStr,
      isFuture: dayDate > today
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
  if (!targetProfile.value) return

  loading.value = true
  try {
    monthEntries.value = await entries.getEntriesForMonth(
      targetProfile.value.id,
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
  emit('select', dateStr)
  emit('update:open', false)
}

function goToToday() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  selectDay(todayStr)
}

// Load month when opened
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    loading.value = true
    initialized.value = false
    // Set calendar to the month of the current date being viewed
    if (props.currentDateStr) {
      const [year, month] = props.currentDateStr.split('-').map(Number)
      currentDate.value = new Date(year, month - 1, 1)
    } else {
      currentDate.value = new Date()
    }
    await loadMonth()
    initialized.value = true
  }
})

watch(currentDate, async () => {
  if (initialized.value) {
    await loadMonth()
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Select Date</DialogTitle>
        <DialogDescription class="sr-only">
          Navigate to a specific date to view or edit entries
        </DialogDescription>
      </DialogHeader>

      <!-- Loading state - show skeleton calendar to prevent layout shift -->
      <div v-if="!initialized" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="w-8 h-8" />
          <div class="h-6 w-32 bg-muted rounded animate-pulse" />
          <div class="w-8 h-8" />
        </div>
        <div class="grid grid-cols-7 gap-1">
          <div v-for="i in 42" :key="i" class="aspect-square rounded-full bg-muted/50 animate-pulse" />
        </div>
      </div>

      <!-- Calendar content -->
      <template v-else>
        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" @click="prevMonth" :disabled="loading">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <h2 class="text-lg font-semibold">{{ currentMonth }}</h2>
          <Button variant="ghost" size="icon" @click="nextMonth" :disabled="loading">
            <ChevronRight class="h-5 w-5" />
          </Button>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1 text-center" :class="{ 'opacity-50': loading }">
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
              :disabled="loading || day.isFuture"
              class="aspect-square flex items-center justify-center rounded-full text-sm transition-colors"
              :class="{
                'bg-primary text-primary-foreground': day.isSelected,
                'ring-2 ring-primary ring-offset-2 ring-offset-background': day.isToday && !day.isSelected,
                'bg-primary/20': day.hasEntry && !day.isSelected && !day.isFuture,
                'hover:bg-muted': !day.isSelected && !loading && !day.isFuture,
                'opacity-30 cursor-not-allowed': day.isFuture
              }"
            >
              {{ day.day }}
            </button>
          </template>
        </div>

        <!-- Legend and Today button -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t">
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full ring-2 ring-primary ring-offset-1 ring-offset-background" />
              <span>Today</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 rounded-full bg-primary/20" />
              <span>Has entry</span>
            </div>
          </div>
          <Button variant="outline" size="sm" @click="goToToday" :disabled="loading">
            Go to Today
          </Button>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
