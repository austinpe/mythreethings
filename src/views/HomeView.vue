<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { useFollowersStore } from '@/stores/followers'
import { useSuggestionsStore } from '@/stores/suggestions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/AppHeader.vue'
import ThingInput from '@/components/ThingInput.vue'
import SuggestionDialog from '@/components/SuggestionDialog.vue'
import SuggestionsBanner from '@/components/SuggestionsBanner.vue'
import { Plus, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-vue-next'

const profiles = useProfilesStore()
const entries = useEntriesStore()
const followers = useFollowersStore()
const suggestions = useSuggestionsStore()

// Check if we're viewing another profile (read-only mode)
const isViewingOther = computed(() => followers.isViewingOther)

// The profile we're viewing entries for
const targetProfile = computed(() => {
  if (isViewingOther.value) {
    return followers.viewingProfile
  }
  return profiles.activeProfile
})

// Track pending changes for save on navigation
const pendingThingIndex = ref(null)
const pendingBonusNotes = ref(false)

// Debounce timers for auto-save
const DEBOUNCE_DELAY = 1500 // 1.5 seconds
let thingDebounceTimer = null
let bonusNotesDebounceTimer = null

const currentDate = ref(new Date())
const initialLoading = ref(true)

const bonusNotes = ref('')
const thingValues = ref(['', '', ''])

// Suggestion dialog state
const showSuggestionDialog = ref(false)
const suggestionLoading = ref(false)

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

// Suggestion handlers
async function handleSuggestionSubmit(content) {
  if (!profiles.activeProfile || !targetProfile.value) return

  suggestionLoading.value = true
  try {
    await suggestions.createSuggestion(
      profiles.activeProfile.id,
      targetProfile.value.id,
      currentDateStr.value,
      content
    )
    showSuggestionDialog.value = false
  } finally {
    suggestionLoading.value = false
  }
}

async function handleAcceptSuggestion(suggestionId) {
  if (!profiles.activeProfile) return

  suggestionLoading.value = true
  try {
    await suggestions.acceptSuggestion(
      suggestionId,
      profiles.activeProfile.id,
      currentDateStr.value
    )
    // Reload the entry to show the new thing
    await loadEntry()
  } finally {
    suggestionLoading.value = false
  }
}

async function handleDeclineSuggestion(suggestionId) {
  suggestionLoading.value = true
  try {
    await suggestions.declineSuggestion(suggestionId)
  } finally {
    suggestionLoading.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  await profiles.fetchProfiles()
  await loadEntry()
  initialLoading.value = false
})

// Watch for profile or date changes
watch(() => profiles.activeProfileId, async () => {
  if (!isViewingOther.value) {
    await loadEntry()
  }
})

watch(currentDate, async () => {
  await loadEntry()
})

// Watch for viewing profile changes
watch(() => followers.viewingProfile, async () => {
  await loadEntry()
})

async function loadEntry() {
  if (!targetProfile.value) return

  // Only save pending changes if not in read-only mode
  if (!isViewingOther.value) {
    await saveAllPending()
  }

  await entries.loadEntryForDate(targetProfile.value.id, currentDate.value)

  // Fetch suggestions for this date (only when viewing own profile)
  if (!isViewingOther.value && profiles.activeProfile) {
    await suggestions.fetchSuggestionsForDate(profiles.activeProfile.id, currentDateStr.value)
  }

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

function clearAllTimers() {
  if (thingDebounceTimer) {
    clearTimeout(thingDebounceTimer)
    thingDebounceTimer = null
  }
  if (bonusNotesDebounceTimer) {
    clearTimeout(bonusNotesDebounceTimer)
    bonusNotesDebounceTimer = null
  }
}

function handleThingFocus(index) {
  pendingThingIndex.value = index
}

function handleThingInput(index, value) {
  // Update local value
  thingValues.value[index] = value
  pendingThingIndex.value = index

  // Clear existing timer for this thing
  if (thingDebounceTimer) {
    clearTimeout(thingDebounceTimer)
  }

  // Set new debounced save
  thingDebounceTimer = setTimeout(async () => {
    thingDebounceTimer = null
    await entries.saveThing(index, value)
    // Only clear pending if still on same index
    if (pendingThingIndex.value === index) {
      pendingThingIndex.value = null
    }
  }, DEBOUNCE_DELAY)
}

async function handleThingBlur(index, value) {
  // Cancel debounce timer since we're saving immediately
  if (thingDebounceTimer) {
    clearTimeout(thingDebounceTimer)
    thingDebounceTimer = null
  }
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

function handleBonusNotesInput() {
  pendingBonusNotes.value = true

  // Clear existing timer
  if (bonusNotesDebounceTimer) {
    clearTimeout(bonusNotesDebounceTimer)
  }

  // Set new debounced save
  bonusNotesDebounceTimer = setTimeout(async () => {
    bonusNotesDebounceTimer = null
    await entries.saveBonusNotes(bonusNotes.value)
    pendingBonusNotes.value = false
  }, DEBOUNCE_DELAY)
}

async function handleBonusNotesBlur() {
  // Cancel debounce timer since we're saving immediately
  if (bonusNotesDebounceTimer) {
    clearTimeout(bonusNotesDebounceTimer)
    bonusNotesDebounceTimer = null
  }
  pendingBonusNotes.value = false
  await entries.saveBonusNotes(bonusNotes.value)
}

async function saveAllPending() {
  // Clear any pending debounce timers
  clearAllTimers()

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

    <!-- Managed profile banner (only when editing own profile) -->
    <div v-if="isManaged && !isViewingOther" class="bg-primary/10 border-b border-primary/20">
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

      <!-- Read-only view (viewing another profile) -->
      <div v-else-if="isViewingOther" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">{{ targetProfile?.name }}'s gratitude</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- Display things as read-only list -->
            <div
              v-for="(thing, index) in entries.things"
              :key="thing.id"
              class="flex items-center gap-2"
            >
              <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                {{ index + 1 }}
              </span>
              <p class="flex-1 py-2">{{ thing.content }}</p>
            </div>

            <!-- Empty state -->
            <p v-if="entries.things.length === 0" class="text-center text-muted-foreground py-4">
              No entries for this day yet.
            </p>
          </CardContent>
        </Card>

        <!-- Bonus notes (read-only) -->
        <Card v-if="entries.currentEntry?.bonus_notes">
          <CardHeader>
            <CardTitle class="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground whitespace-pre-wrap">{{ entries.currentEntry.bonus_notes }}</p>
          </CardContent>
        </Card>

        <!-- Suggest something button -->
        <div class="flex justify-center">
          <Button variant="outline" @click="showSuggestionDialog = true">
            <Lightbulb class="h-4 w-4 mr-2" />
            Suggest something
          </Button>
        </div>

        <!-- Suggestion dialog -->
        <SuggestionDialog
          v-model:open="showSuggestionDialog"
          :target-name="targetProfile?.name"
          :date-str="currentDateStr"
          @submit="handleSuggestionSubmit"
        />
      </div>

      <!-- Entry form (editing own profile) -->
      <div v-else class="space-y-6">
        <!-- Suggestions banner -->
        <SuggestionsBanner
          :suggestions="suggestions.suggestionsForDate"
          :loading="suggestionLoading"
          @accept="handleAcceptSuggestion"
          @decline="handleDeclineSuggestion"
        />

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">What are you thankful for today?</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <ThingInput
              v-for="(value, index) in thingValues"
              :key="index"
              :model-value="thingValues[index]"
              @update:model-value="handleThingInput(index, $event)"
              :index="index"
              :can-remove="thingValues.length > 3"
              :placeholder="`Thing #${index + 1}`"
              @focus="handleThingFocus(index)"
              @blur="handleThingBlur(index, $event)"
              @remove="removeThing(index)"
            />

            <!-- Aligned with ThingInput: w-8 number + gap-2 = 40px left, gap-2 + w-8 placeholder = 40px right -->
            <div class="flex">
              <div class="w-8 flex-shrink-0" />
              <div class="flex-1 mx-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  @click="addThing"
                >
                  <Plus class="h-4 w-4 mr-2" />
                  Add another
                </Button>
              </div>
              <div class="w-8 flex-shrink-0" />
            </div>
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
              @input="handleBonusNotesInput"
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
