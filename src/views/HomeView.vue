<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/AppHeader.vue'
import ThingInput from '@/components/ThingInput.vue'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const profiles = useProfilesStore()
const entries = useEntriesStore()

// Track pending changes for save on navigation
const pendingThingIndex = ref(null)
const pendingBonusNotes = ref(false)

const currentDate = ref(new Date())
const initialLoading = ref(true)

const bonusNotes = ref('')
const thingValues = ref(['', '', ''])

const currentDateStr = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = String(currentDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const displayDate = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const isToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const current = new Date(currentDate.value)
  current.setHours(0, 0, 0, 0)

  return today.getTime() === current.getTime()
})

const friendlyName = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const current = new Date(currentDate.value)
  current.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - current.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays === 7) return '1 Week Ago'
  if (diffDays === 14) return '2 Weeks Ago'
  if (diffDays === 30 || diffDays === 31) return '1 Month Ago'
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} Days Ago`

  return '' // No friendly name for other dates
})

function handleDateSelect(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  currentDate.value = new Date(year, month - 1, day)
}

function prevDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 1)
  currentDate.value = newDate
}

function nextDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 1)
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

const isManaged = computed(() => {
  return profiles.activeProfile?.is_managed ?? false
})

// Initialize on mount
onMounted(async () => {
  await profiles.fetchProfiles()
  await loadEntry()
  initialLoading.value = false
})

// Watch for profile or date changes
watch(() => profiles.activeProfileId, async () => {
  await loadEntry()
})

watch(currentDate, async () => {
  await loadEntry()
})

async function loadEntry() {
  if (!profiles.activeProfile) return

  await entries.loadEntryForDate(profiles.activeProfile.id, currentDate.value)

  // Populate local values from loaded things
  const newValues = ['', '', '']
  entries.things.forEach((thing, i) => {
    if (i < newValues.length) {
      newValues[i] = thing.content
    } else {
      newValues.push(thing.content)
    }
  })

  // Ensure at least 3 slots
  while (newValues.length < 3) {
    newValues.push('')
  }

  thingValues.value = newValues
  bonusNotes.value = entries.currentEntry?.bonus_notes || ''
}

function handleThingFocus(index) {
  pendingThingIndex.value = index
}

async function handleThingBlur(index, value) {
  pendingThingIndex.value = null
  await entries.saveThing(index, value)
}

async function addThing() {
  thingValues.value.push('')
  await entries.addThing()
}

async function removeThing(index) {
  thingValues.value.splice(index, 1)
  await entries.removeThing(index)
}

function handleBonusNotesFocus() {
  pendingBonusNotes.value = true
}

async function handleBonusNotesBlur() {
  pendingBonusNotes.value = false
  await entries.saveBonusNotes(bonusNotes.value)
}

async function saveAllPending() {
  // Save any pending thing
  if (pendingThingIndex.value !== null) {
    await entries.saveThing(pendingThingIndex.value, thingValues.value[pendingThingIndex.value])
    pendingThingIndex.value = null
  }
  // Save pending bonus notes
  if (pendingBonusNotes.value) {
    await entries.saveBonusNotes(bonusNotes.value)
    pendingBonusNotes.value = false
  }
}

// Save pending changes when leaving the route
onBeforeRouteLeave(async () => {
  await saveAllPending()
})

// Save pending changes on unmount
onBeforeUnmount(async () => {
  await saveAllPending()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader
      :current-date-str="currentDateStr"
      @date-select="handleDateSelect"
    />

    <!-- Managed profile banner -->
    <div v-if="isManaged" class="bg-primary/10 border-b border-primary/20">
      <div class="container mx-auto px-4 py-2 text-center text-sm text-primary">
        Logging for <strong>{{ profiles.activeProfile?.name }}</strong>
      </div>
    </div>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- Date navigation -->
      <div class="flex items-center justify-center gap-2 mb-6">
        <Button variant="ghost" size="icon" @click="prevDay">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="text-center flex-1">
          <p class="text-sm text-primary font-medium h-5">{{ friendlyName }}</p>
          <p class="text-lg font-semibold">{{ displayDate }}</p>
        </div>
        <Button variant="ghost" size="icon" @click="nextDay" :disabled="isToday" :class="{ 'opacity-30': isToday }">
          <ChevronRight class="h-5 w-5" />
        </Button>
      </div>

      <!-- Loading state -->
      <div v-if="initialLoading || entries.loading" class="text-center py-8 text-muted-foreground">
        Loading...
      </div>

      <!-- Entry form -->
      <div v-else class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">What are you thankful for today?</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <ThingInput
              v-for="(value, index) in thingValues"
              :key="index"
              v-model="thingValues[index]"
              :index="index"
              :can-remove="thingValues.length > 3"
              :placeholder="`Thing #${index + 1}`"
              @focus="handleThingFocus(index)"
              @blur="handleThingBlur(index, $event)"
              @remove="removeThing(index)"
            />

            <Button
              variant="outline"
              size="sm"
              class="w-full"
              @click="addThing"
            >
              <Plus class="h-4 w-4 mr-2" />
              Add another
            </Button>
          </CardContent>
        </Card>

        <!-- Bonus notes -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Anything else on your mind?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="bonusNotes"
              @focus="handleBonusNotesFocus"
              @blur="handleBonusNotesBlur"
              placeholder="Optional notes about your day..."
              rows="4"
              spellcheck="true"
            />
          </CardContent>
        </Card>

        <!-- Save indicator -->
        <div v-if="entries.saving" class="text-center text-sm text-muted-foreground">
          Saving...
        </div>
      </div>
    </main>
  </div>
</template>
