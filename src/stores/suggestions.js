import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'

export const useSuggestionsStore = defineStore('suggestions', () => {
  // All pending suggestions for profiles the user manages
  const pendingSuggestions = ref([])
  // Suggestions for the currently viewed date
  const suggestionsForDate = ref([])
  const loading = ref(false)

  const pendingCount = computed(() => pendingSuggestions.value.length)

  /**
   * Fetch all pending suggestions for profiles the user manages
   * Used for badge count and notifications
   */
  async function fetchPendingSuggestions(managedProfileIds) {
    if (!managedProfileIds || managedProfileIds.length === 0) {
      pendingSuggestions.value = []
      return
    }

    try {
      const filter = managedProfileIds
        .map(id => `to_profile = "${id}"`)
        .join(' || ')

      const records = await pb.collection('suggestions').getFullList({
        filter: `(${filter}) && status = "pending"`,
        expand: 'from_profile',
        sort: '-created',
        requestKey: null
      })

      pendingSuggestions.value = records.map(r => ({
        id: r.id,
        fromProfile: r.expand?.from_profile,
        toProfileId: r.to_profile,
        date: r.date,
        content: r.content,
        status: r.status,
        created: r.created
      }))
    } catch (err) {
      console.error('Error fetching pending suggestions:', err)
    }
  }

  /**
   * Fetch suggestions for a specific profile and date
   */
  async function fetchSuggestionsForDate(profileId, dateStr) {
    if (!profileId || !dateStr) {
      suggestionsForDate.value = []
      return
    }

    try {
      // Calculate next day for range query
      const date = new Date(dateStr)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDateStr = nextDay.toISOString().split('T')[0]

      const records = await pb.collection('suggestions').getFullList({
        filter: `to_profile = "${profileId}" && date >= "${dateStr}" && date < "${nextDateStr}" && status = "pending"`,
        expand: 'from_profile',
        sort: '-created',
        requestKey: null
      })

      suggestionsForDate.value = records.map(r => ({
        id: r.id,
        fromProfile: r.expand?.from_profile,
        toProfileId: r.to_profile,
        date: r.date,
        content: r.content,
        status: r.status,
        created: r.created
      }))
    } catch (err) {
      console.error('Error fetching suggestions for date:', err)
      suggestionsForDate.value = []
    }
  }

  /**
   * Create a suggestion for someone you follow
   */
  async function createSuggestion(fromProfileId, toProfileId, dateStr, content) {
    if (!fromProfileId || !toProfileId || !dateStr || !content.trim()) {
      throw new Error('Missing required fields')
    }

    const record = await pb.collection('suggestions').create({
      from_profile: fromProfileId,
      to_profile: toProfileId,
      date: dateStr,
      content: content.trim(),
      status: 'pending'
    })

    return record
  }

  /**
   * Accept a suggestion - creates entry if needed, adds thing
   */
  async function acceptSuggestion(suggestionId, profileId, dateStr) {
    const suggestion = pendingSuggestions.value.find(s => s.id === suggestionId)
      || suggestionsForDate.value.find(s => s.id === suggestionId)

    if (!suggestion) {
      throw new Error('Suggestion not found')
    }

    // Find or create entry for this date
    const nextDay = new Date(dateStr)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDateStr = nextDay.toISOString().split('T')[0]

    let entry
    const entries = await pb.collection('entries').getList(1, 1, {
      filter: `profile = "${profileId}" && date >= "${dateStr}" && date < "${nextDateStr}"`,
      requestKey: null
    })

    if (entries.items.length > 0) {
      entry = entries.items[0]
    } else {
      // Create new entry
      entry = await pb.collection('entries').create({
        profile: profileId,
        date: dateStr,
        bonus_notes: ''
      })
    }

    // Get current max order
    const existingThings = await pb.collection('things').getFullList({
      filter: `entry = "${entry.id}"`,
      sort: '-order',
      requestKey: null
    })

    const maxOrder = existingThings.length > 0 ? existingThings[0].order : 0

    // Create the thing
    await pb.collection('things').create({
      entry: entry.id,
      content: suggestion.content,
      order: maxOrder + 1
    })

    // Update suggestion status
    await pb.collection('suggestions').update(suggestionId, {
      status: 'accepted'
    })

    // Remove from local state
    pendingSuggestions.value = pendingSuggestions.value.filter(s => s.id !== suggestionId)
    suggestionsForDate.value = suggestionsForDate.value.filter(s => s.id !== suggestionId)

    return entry
  }

  /**
   * Decline a suggestion
   */
  async function declineSuggestion(suggestionId) {
    await pb.collection('suggestions').update(suggestionId, {
      status: 'declined'
    })

    // Remove from local state
    pendingSuggestions.value = pendingSuggestions.value.filter(s => s.id !== suggestionId)
    suggestionsForDate.value = suggestionsForDate.value.filter(s => s.id !== suggestionId)
  }

  function clear() {
    pendingSuggestions.value = []
    suggestionsForDate.value = []
  }

  return {
    pendingSuggestions,
    suggestionsForDate,
    pendingCount,
    loading,
    fetchPendingSuggestions,
    fetchSuggestionsForDate,
    createSuggestion,
    acceptSuggestion,
    declineSuggestion,
    clear
  }
})
