<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/AppHeader.vue'
import ThingInput from '@/components/ThingInput.vue'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const profiles = useProfilesStore()
const entries = useEntriesStore()

// Track pending changes for save on navigation
const pendingThingIndex = ref(null)
const pendingBonusNotes = ref(false)

const bonusNotes = ref('')
const thingValues = ref(['', '', ''])
const initialLoading = ref(true)

const dateStr = computed(() => route.params.date)

const formattedDate = computed(() => {
  if (!dateStr.value) return ''
  const date = new Date(dateStr.value + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const isToday = computed(() => {
  if (!dateStr.value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const current = new Date(dateStr.value + 'T00:00:00')

  return today.getTime() === current.getTime()
})

const friendlyName = computed(() => {
  if (!dateStr.value) return ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const current = new Date(dateStr.value + 'T00:00:00')

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

function prevDay() {
  const date = new Date(dateStr.value + 'T00:00:00')
  date.setDate(date.getDate() - 1)
  const newDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  router.push(`/entry/${newDateStr}`)
}

function nextDay() {
  const date = new Date(dateStr.value + 'T00:00:00')
  date.setDate(date.getDate() + 1)
  const newDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  router.push(`/entry/${newDateStr}`)
}

function handleDateSelect(newDateStr) {
  router.push(`/entry/${newDateStr}`)
}

async function loadEntry() {
  if (!profiles.activeProfile || !dateStr.value) return

  const date = new Date(dateStr.value + 'T00:00:00')
  await entries.loadEntryForDate(profiles.activeProfile.id, date)

  // Populate local values from loaded things
  const newValues = ['', '', '']
  entries.things.forEach((thing, i) => {
    if (i < newValues.length) {
      newValues[i] = thing.content
    } else {
      newValues.push(thing.content)
    }
  })

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
  if (pendingThingIndex.value !== null) {
    await entries.saveThing(pendingThingIndex.value, thingValues.value[pendingThingIndex.value])
    pendingThingIndex.value = null
  }
  if (pendingBonusNotes.value) {
    await entries.saveBonusNotes(bonusNotes.value)
    pendingBonusNotes.value = false
  }
}

onBeforeRouteLeave(async () => {
  await saveAllPending()
})

onBeforeUnmount(async () => {
  await saveAllPending()
})

onMounted(async () => {
  if (!profiles.profiles.length) {
    await profiles.fetchProfiles()
  }
  await loadEntry()
  initialLoading.value = false
})

watch(() => profiles.activeProfileId, loadEntry)
watch(dateStr, loadEntry)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader
      :current-date-str="dateStr"
      @date-select="handleDateSelect"
    />

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- Date navigation -->
      <div class="flex items-center justify-center gap-2 mb-6">
        <Button variant="ghost" size="icon" @click="prevDay">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="text-center flex-1">
          <p class="text-sm text-primary font-medium h-5">{{ friendlyName }}</p>
          <p class="text-lg font-semibold">{{ formattedDate }}</p>
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
            <CardTitle class="text-lg">Three things</CardTitle>
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
            <CardTitle class="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="bonusNotes"
              @focus="handleBonusNotesFocus"
              @blur="handleBonusNotesBlur"
              placeholder="Optional notes about this day..."
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
