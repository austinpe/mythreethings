import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'

export const useFollowersStore = defineStore('followers', () => {
  // Profiles that the active profile follows
  const following = ref([])
  // Pending follow requests to profiles I manage
  const pendingRequests = ref([])
  // Currently viewing another profile's entries
  const viewingProfile = ref(null)
  const loading = ref(false)

  const acceptedFollowing = computed(() => {
    return following.value.filter(f => f.status === 'accepted')
  })

  const pendingFollowing = computed(() => {
    return following.value.filter(f => f.status === 'pending')
  })

  /**
   * Fetch profiles that the active profile follows
   */
  async function fetchFollowing(activeProfileId) {
    if (!activeProfileId) return

    loading.value = true
    try {
      const records = await pb.collection('profile_followers').getFullList({
        filter: `follower = "${activeProfileId}"`,
        expand: 'following',
        requestKey: null
      })

      following.value = records.map(r => ({
        id: r.id,
        status: r.status,
        profile: r.expand?.following,
        created: r.created
      })).filter(f => f.profile)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch pending follow requests to profiles I manage
   */
  async function fetchPendingRequests(managedProfileIds) {
    if (!managedProfileIds || managedProfileIds.length === 0) return

    try {
      const filter = managedProfileIds
        .map(id => `following = "${id}"`)
        .join(' || ')

      const records = await pb.collection('profile_followers').getFullList({
        filter: `(${filter}) && status = "pending"`,
        expand: 'follower',
        requestKey: null
      })

      pendingRequests.value = records.map(r => ({
        id: r.id,
        followerProfile: r.expand?.follower,
        followingProfileId: r.following,
        created: r.created
      })).filter(r => r.followerProfile)
    } catch (err) {
      console.error('Error fetching pending requests:', err)
    }
  }

  /**
   * Follow a profile by their share code
   */
  async function followByCode(activeProfileId, shareCode) {
    if (!activeProfileId || !shareCode) return null

    // Find profile with this share code
    const profiles = await pb.collection('profiles').getList(1, 1, {
      filter: `share_code = "${shareCode.trim()}"`
    })

    if (profiles.items.length === 0) {
      throw new Error('No profile found with that share code')
    }

    const targetProfile = profiles.items[0]

    // Check if already following
    const existing = await pb.collection('profile_followers').getList(1, 1, {
      filter: `follower = "${activeProfileId}" && following = "${targetProfile.id}"`
    })

    if (existing.items.length > 0) {
      throw new Error('You are already following this profile')
    }

    // Can't follow yourself
    if (targetProfile.id === activeProfileId) {
      throw new Error('You cannot follow your own profile')
    }

    // Create follow request
    const record = await pb.collection('profile_followers').create({
      follower: activeProfileId,
      following: targetProfile.id,
      status: 'pending'
    })

    // Add to local state
    following.value.push({
      id: record.id,
      status: 'pending',
      profile: targetProfile,
      created: record.created
    })

    return targetProfile
  }

  /**
   * Accept a pending follow request
   */
  async function acceptFollowRequest(requestId) {
    await pb.collection('profile_followers').update(requestId, {
      status: 'accepted'
    })

    // Remove from pending requests
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId)
  }

  /**
   * Decline a pending follow request
   */
  async function declineFollowRequest(requestId) {
    await pb.collection('profile_followers').delete(requestId)
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId)
  }

  /**
   * Unfollow a profile
   */
  async function unfollowProfile(followRecordId) {
    await pb.collection('profile_followers').delete(followRecordId)
    following.value = following.value.filter(f => f.id !== followRecordId)
  }

  /**
   * Set the profile we're currently viewing
   */
  function setViewingProfile(profile) {
    viewingProfile.value = profile
  }

  /**
   * Clear viewing state
   */
  function clearViewingProfile() {
    viewingProfile.value = null
  }

  /**
   * Check if we're currently viewing another profile
   */
  const isViewingOther = computed(() => {
    return viewingProfile.value !== null
  })

  function clear() {
    following.value = []
    pendingRequests.value = []
    viewingProfile.value = null
  }

  return {
    following,
    pendingRequests,
    viewingProfile,
    loading,
    acceptedFollowing,
    pendingFollowing,
    isViewingOther,
    fetchFollowing,
    fetchPendingRequests,
    followByCode,
    acceptFollowRequest,
    declineFollowRequest,
    unfollowProfile,
    setViewingProfile,
    clearViewingProfile,
    clear
  }
})
