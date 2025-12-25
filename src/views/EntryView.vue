<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import ThingInput from '@/components/ThingInput.vue'
import { ChevronLeft, Plus, Calendar } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const profiles = useProfilesStore()
const entries = useEntriesStore()

const bonusNotes = ref('')
const thingValues = ref(['', '', ''])
const hasEntry = ref(false)

const dateStr = computed(() => route.params.date)

const formattedDate = computed(() => {
  if (!dateStr.value) return ''
  const date = new Date(dateStr.value + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const isToday = computed(() => {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return dateStr.value === todayStr
})

async function loadEntry() {
  if (!profiles.activeProfile || !dateStr.value) return

  const entry = await entries.getEntry(profiles.activeProfile.id, dateStr.value)

  if (entry) {
    hasEntry.value = true
    bonusNotes.value = entry.bonus_notes || ''

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
  } else {
    hasEntry.value = false
    thingValues.value = ['', '', '']
    bonusNotes.value = ''
  }
}

async function createEntry() {
  if (!profiles.activeProfile) return

  const date = new Date(dateStr.value + 'T00:00:00')
  await entries.getOrCreateEntry(profiles.activeProfile.id, date)
  await loadEntry()
}

async function handleThingBlur(index, value) {
  if (!hasEntry.value) return
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

async function handleBonusNotesBlur() {
  if (!hasEntry.value) return
  await entries.saveBonusNotes(bonusNotes.value)
}

onMounted(async () => {
  if (!profiles.profiles.length) {
    await profiles.fetchProfiles()
  }
  await loadEntry()
})

watch(() => profiles.activeProfileId, loadEntry)
watch(dateStr, loadEntry)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" @click="router.push('/history')">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <ProfileSwitcher />
        <Button v-if="isToday" variant="ghost" size="icon" @click="router.push('/')">
          <Calendar class="h-5 w-5" />
        </Button>
        <div v-else class="w-10" />
      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold mb-1">{{ formattedDate }}</h1>
        <p v-if="isToday" class="text-primary text-sm">Today</p>
      </div>

      <!-- No entry state -->
      <div v-if="!hasEntry && !entries.loading" class="text-center py-8">
        <p class="text-muted-foreground mb-4">No entry for this day yet.</p>
        <Button @click="createEntry">
          <Plus class="h-4 w-4 mr-2" />
          Create entry
        </Button>
      </div>

      <!-- Loading state -->
      <div v-else-if="entries.loading" class="text-center py-8 text-muted-foreground">
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
              @blur="handleBonusNotesBlur"
              placeholder="Optional notes about this day..."
              rows="4"
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
