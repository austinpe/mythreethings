import { defineStore } from 'pinia'
import { ref } from 'vue'
import pb from '@/lib/pocketbase'

export const useEntriesStore = defineStore('entries', () => {
  const currentEntry = ref(null)
  const things = ref([])
  const loading = ref(false)
  const saving = ref(false)

  function formatDate(date) {
    // Use local date, not UTC, to match what users see in the UI
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Current profile and date being viewed (needed for lazy entry creation)
  const currentProfileId = ref(null)
  const currentDateStr = ref(null)

  async function loadEntryForDate(profileId, date = new Date()) {
    if (!profileId) return null

    loading.value = true
    currentProfileId.value = profileId
    currentDateStr.value = formatDate(date)

    try {
      // Calculate next day for range query
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDateStr = formatDate(nextDay)

      // Try to find existing entry using date range to avoid format mismatches
      const entries = await pb.collection('entries').getList(1, 1, {
        filter: `profile = "${profileId}" && date >= "${currentDateStr.value}" && date < "${nextDateStr}"`,
        requestKey: null // Disable auto-cancellation
      })

      if (entries.items.length > 0) {
        currentEntry.value = entries.items[0]
        await fetchThings()
      } else {
        // No entry yet - that's fine, we'll create it when user adds content
        currentEntry.value = null
        things.value = []
      }

      return currentEntry.value
    } finally {
      loading.value = false
    }
  }

  async function ensureEntry() {
    // Create entry if it doesn't exist yet
    if (currentEntry.value) return currentEntry.value
    if (!currentProfileId.value || !currentDateStr.value) return null

    currentEntry.value = await pb.collection('entries').create({
      profile: currentProfileId.value,
      date: currentDateStr.value,
      bonus_notes: ''
    })

    return currentEntry.value
  }

  async function fetchThings() {
    if (!currentEntry.value) {
      things.value = []
      return
    }

    const thingRecords = await pb.collection('things').getFullList({
      filter: `entry = "${currentEntry.value.id}"`,
      sort: 'order',
      requestKey: null // Disable auto-cancellation
    })

    things.value = thingRecords
  }

  async function saveThing(index, content) {
    // Only save if there's content to save
    if (!content.trim() && !things.value[index]) return

    saving.value = true
    try {
      const existingThing = things.value[index]

      if (existingThing) {
        // Update existing
        if (content.trim()) {
          const updated = await pb.collection('things').update(existingThing.id, {
            content: content.trim()
          })
          things.value[index] = updated
        } else {
          // Delete if content is empty
          await pb.collection('things').delete(existingThing.id)
          things.value.splice(index, 1)
          // Reorder remaining things
          await reorderThings()
        }
      } else if (content.trim()) {
        // Create entry first if needed
        await ensureEntry()
        if (!currentEntry.value) return

        // Create new thing
        const newThing = await pb.collection('things').create({
          entry: currentEntry.value.id,
          content: content.trim(),
          order: index + 1
        })
        things.value.push(newThing)
      }
    } finally {
      saving.value = false
    }
  }

  async function addThing() {
    // Don't create an empty record - just add a placeholder locally
    // The actual record will be created when saveThing is called with content
    // This avoids 400 errors from PocketBase's required content validation
    return null
  }

  async function removeThing(index) {
    if (!things.value[index]) return

    saving.value = true
    try {
      await pb.collection('things').delete(things.value[index].id)
      things.value.splice(index, 1)
      await reorderThings()
    } finally {
      saving.value = false
    }
  }

  async function reorderThings() {
    // Update order for all things
    for (let i = 0; i < things.value.length; i++) {
      if (things.value[i].order !== i + 1) {
        things.value[i] = await pb.collection('things').update(things.value[i].id, {
          order: i + 1
        })
      }
    }
  }

  async function saveBonusNotes(notes) {
    // Only save if there's content
    if (!notes.trim() && !currentEntry.value) return

    saving.value = true
    try {
      // Create entry first if needed
      await ensureEntry()
      if (!currentEntry.value) return

      currentEntry.value = await pb.collection('entries').update(currentEntry.value.id, {
        bonus_notes: notes
      })
    } finally {
      saving.value = false
    }
  }

  async function getEntriesForMonth(profileId, year, month) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    const entries = await pb.collection('entries').getFullList({
      filter: `profile = "${profileId}" && date >= "${formatDate(startDate)}" && date <= "${formatDate(endDate)}"`,
      sort: '-date',
      requestKey: null // Disable auto-cancellation
    })

    return entries
  }

  function clear() {
    currentEntry.value = null
    things.value = []
  }

  return {
    currentEntry,
    things,
    loading,
    saving,
    loadEntryForDate,
    ensureEntry,
    getEntriesForMonth,
    fetchThings,
    saveThing,
    addThing,
    removeThing,
    saveBonusNotes,
    clear
  }
})
