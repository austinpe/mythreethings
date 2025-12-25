<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfilesStore } from '@/stores/profiles'
import { useEntriesStore } from '@/stores/entries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import ThingInput from '@/components/ThingInput.vue'
import { Plus, Calendar, Settings, LogOut, Users } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const profiles = useProfilesStore()
const entries = useEntriesStore()

const bonusNotes = ref('')
const thingValues = ref(['', '', ''])

const today = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const isManaged = computed(() => {
  return profiles.activeProfile?.is_managed ?? false
})

// Initialize on mount
onMounted(async () => {
  await profiles.fetchProfiles()
  await loadTodayEntry()
})

// Watch for profile changes
watch(() => profiles.activeProfileId, async () => {
  await loadTodayEntry()
})

async function loadTodayEntry() {
  if (!profiles.activeProfile) return

  await entries.getOrCreateEntry(profiles.activeProfile.id)

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

async function handleThingBlur(index, value) {
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
  await entries.saveBonusNotes(bonusNotes.value)
}

function logout() {
  auth.logout()
  entries.clear()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <ProfileSwitcher />
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" @click="router.push('/history')">
            <Calendar class="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" @click="router.push('/profiles')">
            <Users class="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" @click="router.push('/settings')">
            <Settings class="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" @click="logout">
            <LogOut class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Managed profile banner -->
    <div v-if="isManaged" class="bg-primary/10 border-b border-primary/20">
      <div class="container mx-auto px-4 py-2 text-center text-sm text-primary">
        Logging for <strong>{{ profiles.activeProfile?.name }}</strong>
      </div>
    </div>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold mb-1">My Three Things</h1>
        <p class="text-muted-foreground">{{ today }}</p>
      </div>

      <!-- Loading state -->
      <div v-if="entries.loading" class="text-center py-8 text-muted-foreground">
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
              @blur="handleBonusNotesBlur"
              placeholder="Optional notes about your day..."
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
