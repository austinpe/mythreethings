import { defineStore } from 'pinia'
import { ref } from 'vue'
import pb from '@/lib/pocketbase'

export const useEntriesStore = defineStore('entries', () => {
  const currentEntry = ref(null)
  const things = ref([])
  const loading = ref(false)
  const saving = ref(false)

  function formatDate(date) {
    return date.toISOString().split('T')[0]
  }

  async function getOrCreateEntry(profileId, date = new Date()) {
    if (!profileId) return null

    loading.value = true
    try {
      const dateStr = formatDate(date)

      // Try to find existing entry
      const entries = await pb.collection('entries').getList(1, 1, {
        filter: `profile = "${profileId}" && date = "${dateStr}"`
      })

      if (entries.items.length > 0) {
        currentEntry.value = entries.items[0]
      } else {
        // Create new entry
        currentEntry.value = await pb.collection('entries').create({
          profile: profileId,
          date: dateStr,
          bonus_notes: ''
        })
      }

      // Fetch things for this entry
      await fetchThings()

      return currentEntry.value
    } finally {
      loading.value = false
    }
  }

  async function fetchThings() {
    if (!currentEntry.value) {
      things.value = []
      return
    }

    const thingRecords = await pb.collection('things').getFullList({
      filter: `entry = "${currentEntry.value.id}"`,
      sort: 'order'
    })

    things.value = thingRecords
  }

  async function saveThing(index, content) {
    if (!currentEntry.value) return

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
    if (!currentEntry.value) return

    saving.value = true
    try {
      const newThing = await pb.collection('things').create({
        entry: currentEntry.value.id,
        content: '',
        order: things.value.length + 1
      })
      things.value.push(newThing)
      return newThing
    } finally {
      saving.value = false
    }
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
    if (!currentEntry.value) return

    saving.value = true
    try {
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
      sort: '-date'
    })

    return entries
  }

  async function getEntry(profileId, dateStr) {
    const entries = await pb.collection('entries').getList(1, 1, {
      filter: `profile = "${profileId}" && date = "${dateStr}"`
    })

    if (entries.items.length > 0) {
      currentEntry.value = entries.items[0]
      await fetchThings()
      return currentEntry.value
    }

    return null
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
    getOrCreateEntry,
    getEntriesForMonth,
    getEntry,
    fetchThings,
    saveThing,
    addThing,
    removeThing,
    saveBonusNotes,
    clear
  }
})
