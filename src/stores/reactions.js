import { defineStore } from 'pinia'
import { ref } from 'vue'
import pb from '@/lib/pocketbase'

export const useReactionsStore = defineStore('reactions', () => {
  // Map of thingId -> array of reactions
  const reactionsByThing = ref({})
  const loading = ref(false)

  /**
   * Fetch reactions for multiple things at once
   */
  async function fetchReactionsForThings(thingIds) {
    if (!thingIds || thingIds.length === 0) {
      reactionsByThing.value = {}
      return
    }

    loading.value = true
    try {
      const filter = thingIds
        .map(id => `thing = "${id}"`)
        .join(' || ')

      const records = await pb.collection('things_reactions').getFullList({
        filter,
        expand: 'profile',
        requestKey: null
      })

      // Group by thing ID
      const grouped = {}
      for (const id of thingIds) {
        grouped[id] = []
      }

      for (const record of records) {
        if (grouped[record.thing]) {
          grouped[record.thing].push({
            id: record.id,
            thingId: record.thing,
            profileId: record.profile,
            profileName: record.expand?.profile?.name || 'Unknown',
            emoji: record.emoji
          })
        }
      }

      reactionsByThing.value = grouped
    } catch (err) {
      console.error('Error fetching reactions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get aggregated reaction counts for a thing
   * Returns: { heart: 2, laugh: 1, ... }
   * Optionally exclude a profile's reaction from the count
   */
  function getReactionCounts(thingId, excludeProfileId = null) {
    const reactions = reactionsByThing.value[thingId] || []
    const counts = {}
    for (const reaction of reactions) {
      if (excludeProfileId && reaction.profileId === excludeProfileId) continue
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1
    }
    return counts
  }

  /**
   * Get reactions grouped by emoji with names for tooltips
   * Returns: { heart: ['Alice', 'Bob'], laugh: ['Charlie'], ... }
   * Optionally exclude a profile's reaction
   */
  function getReactionsByEmoji(thingId, excludeProfileId = null) {
    const reactions = reactionsByThing.value[thingId] || []
    const grouped = {}
    for (const reaction of reactions) {
      if (excludeProfileId && reaction.profileId === excludeProfileId) continue
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = []
      }
      grouped[reaction.emoji].push(reaction.profileName)
    }
    return grouped
  }

  /**
   * Get the current user's reaction for a thing (if any)
   */
  function getMyReaction(thingId, profileId) {
    const reactions = reactionsByThing.value[thingId] || []
    return reactions.find(r => r.profileId === profileId)
  }

  /**
   * Toggle a reaction - add, update, or remove
   * If user has no reaction: add it
   * If user has same emoji: remove it
   * If user has different emoji: update it
   */
  async function toggleReaction(thingId, profileId, emoji) {
    const existing = getMyReaction(thingId, profileId)

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji - remove reaction
        await pb.collection('things_reactions').delete(existing.id)
        reactionsByThing.value[thingId] = reactionsByThing.value[thingId]
          .filter(r => r.id !== existing.id)
      } else {
        // Different emoji - update reaction
        const updated = await pb.collection('things_reactions').update(existing.id, {
          emoji
        })
        const idx = reactionsByThing.value[thingId].findIndex(r => r.id === existing.id)
        if (idx !== -1) {
          reactionsByThing.value[thingId][idx].emoji = updated.emoji
        }
      }
    } else {
      // No existing reaction - create new
      const record = await pb.collection('things_reactions').create({
        thing: thingId,
        profile: profileId,
        emoji
      })

      // Fetch profile name for display
      let profileName = 'Unknown'
      try {
        const profile = await pb.collection('profiles').getOne(profileId)
        profileName = profile.name
      } catch (e) {
        // Ignore
      }

      if (!reactionsByThing.value[thingId]) {
        reactionsByThing.value[thingId] = []
      }

      reactionsByThing.value[thingId].push({
        id: record.id,
        thingId: record.thing,
        profileId: record.profile,
        profileName,
        emoji: record.emoji
      })
    }
  }

  function clear() {
    reactionsByThing.value = {}
  }

  return {
    reactionsByThing,
    loading,
    fetchReactionsForThings,
    getReactionCounts,
    getReactionsByEmoji,
    getMyReaction,
    toggleReaction,
    clear
  }
})
