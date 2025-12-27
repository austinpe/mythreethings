<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useFollowersStore } from '@/stores/followers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AppHeader from '@/components/AppHeader.vue'
import { Copy, Check, UserPlus, ChevronRight, Clock, UserCheck, UserX } from 'lucide-vue-next'

const router = useRouter()
const profiles = useProfilesStore()
const followers = useFollowersStore()

const shareCode = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)

const activeShareCode = computed(() => {
  return profiles.activeProfile?.share_code || ''
})

const managedProfileIds = computed(() => {
  return profiles.profiles.map(p => p.id)
})

// Get set of profile IDs we're following (for quick lookup)
const followingProfileIds = computed(() => {
  return new Set(followers.following.map(f => f.profile?.id).filter(Boolean))
})

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

async function copyShareCode() {
  if (!activeShareCode.value) return

  try {
    await navigator.clipboard.writeText(activeShareCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

async function followProfile() {
  if (!shareCode.value.trim()) return

  error.value = ''
  loading.value = true
  try {
    await followers.followByCode(profiles.activeProfile.id, shareCode.value.trim())
    shareCode.value = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function acceptRequest(requestId) {
  loading.value = true
  try {
    await followers.acceptFollowRequest(requestId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function declineRequest(requestId) {
  loading.value = true
  try {
    await followers.declineFollowRequest(requestId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function unfollow(followRecordId) {
  if (!confirm('Are you sure you want to unfollow this profile?')) return

  loading.value = true
  try {
    await followers.unfollowProfile(followRecordId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function viewProfile(profile) {
  followers.setViewingProfile(profile)
  router.push('/')
}

async function handleFollowBack(followerProfileId) {
  error.value = ''
  loading.value = true
  try {
    await followers.followBack(profiles.activeProfile.id, followerProfileId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await profiles.fetchProfiles()
  if (profiles.activeProfile) {
    await followers.fetchFollowing(profiles.activeProfile.id)
    await followers.fetchFollowers(profiles.activeProfile.id)
    await followers.fetchPendingRequests(managedProfileIds.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader :show-calendar="false" :show-connections="false" />

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg space-y-6">
      <!-- Pending requests to my profiles -->
      <div v-if="followers.pendingRequests.length > 0" class="space-y-4">
        <h2 class="font-semibold flex items-center gap-2">
          <Clock class="h-4 w-4" />
          Pending Requests
        </h2>

        <Card v-for="request in followers.pendingRequests" :key="request.id">
          <CardContent class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ getInitials(request.followerProfile?.name) }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ request.followerProfile?.name }}</p>
                  <p class="text-sm text-muted-foreground">wants to follow you</p>
                </div>
              </div>
              <div class="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50"
                  @click="acceptRequest(request.id)"
                  :disabled="loading"
                >
                  <UserCheck class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                  @click="declineRequest(request.id)"
                  :disabled="loading"
                >
                  <UserX class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />
      </div>

      <!-- Following -->
      <div class="space-y-4">
        <h2 class="font-semibold">Following</h2>

        <!-- Pending follows (waiting for acceptance) -->
        <Card v-for="follow in followers.pendingFollowing" :key="follow.id" class="opacity-60">
          <CardContent class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ getInitials(follow.profile?.name) }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ follow.profile?.name }}</p>
                  <p class="text-sm text-muted-foreground">Waiting for approval</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" @click="unfollow(follow.id)" :disabled="loading">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Accepted follows -->
        <Card
          v-for="follow in followers.acceptedFollowing"
          :key="follow.id"
          class="cursor-pointer hover:bg-muted/50 transition-colors"
          @click="viewProfile(follow.profile)"
        >
          <CardContent class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ getInitials(follow.profile?.name) }}</AvatarFallback>
                </Avatar>
                <p class="font-medium">{{ follow.profile?.name }}</p>
              </div>
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <!-- Empty state -->
        <p
          v-if="!followers.acceptedFollowing.length && !followers.pendingFollowing.length"
          class="text-sm text-muted-foreground text-center py-4"
        >
          You're not following anyone yet. Enter a share code below to get started.
        </p>
      </div>

      <Separator />

      <!-- Followers (who follows you) -->
      <div class="space-y-4">
        <h2 class="font-semibold">Followers</h2>

        <Card v-for="follower in followers.followers" :key="follower.id">
          <CardContent class="py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ getInitials(follower.profile?.name) }}</AvatarFallback>
                </Avatar>
                <p class="font-medium">{{ follower.profile?.name }}</p>
              </div>
              <Button
                v-if="!followingProfileIds.has(follower.profile?.id)"
                variant="outline"
                size="sm"
                @click="handleFollowBack(follower.profile?.id)"
                :disabled="loading"
              >
                <UserPlus class="h-4 w-4 mr-1" />
                Follow Back
              </Button>
              <span v-else class="text-sm text-muted-foreground">Following</span>
            </div>
          </CardContent>
        </Card>

        <!-- Empty state -->
        <p
          v-if="!followers.followers.length"
          class="text-sm text-muted-foreground text-center py-4"
        >
          No one is following you yet. Share your code below to let others follow you.
        </p>
      </div>

      <Separator />

      <!-- Your share code -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Your Share Code</CardTitle>
          <CardDescription>
            Share this code with others so they can follow
            <strong>{{ profiles.activeProfile?.name }}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="activeShareCode" class="flex items-center gap-2">
            <code class="flex-1 bg-muted px-3 py-2 rounded text-center font-mono text-lg">
              {{ activeShareCode }}
            </code>
            <Button variant="outline" size="icon" @click="copyShareCode">
              <Check v-if="copied" class="h-4 w-4 text-green-500" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </div>
          <p v-else class="text-sm text-muted-foreground text-center py-2">
            No share code set for this profile
          </p>
        </CardContent>
      </Card>

      <!-- Follow someone -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Follow Someone</CardTitle>
          <CardDescription>Enter their share code to follow their profile</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex gap-2">
            <Input
              :model-value="shareCode"
              @update:model-value="(val) => shareCode = val"
              placeholder="Enter share code"
              class="flex-1 font-mono"
              @keyup.enter="followProfile"
            />
            <Button @click="followProfile" :disabled="loading || !shareCode.trim()">
              <UserPlus class="h-4 w-4 mr-2" />
              Follow
            </Button>
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
