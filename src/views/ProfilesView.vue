<script setup>
import { ref, onMounted } from 'vue'
import { useProfilesStore } from '@/stores/profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AppHeader from '@/components/AppHeader.vue'
import { Plus, UserPlus, LogOut, Users, Copy, Check } from 'lucide-vue-next'

const profiles = useProfilesStore()

const showCreateForm = ref(false)
const showManageForm = ref(null) // profile id or null
const newProfileName = ref('')
const joinCode = ref('')
const managers = ref({}) // { profileId: [managers] }
const error = ref('')
const joinError = ref('')
const loading = ref(false)
const copied = ref(null) // profile id that was copied

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

async function loadManagers(profileId) {
  if (!managers.value[profileId]) {
    managers.value[profileId] = await profiles.getProfileManagers(profileId)
  }
  return managers.value[profileId]
}

async function createProfile() {
  if (!newProfileName.value.trim()) return

  error.value = ''
  loading.value = true
  try {
    await profiles.createManagedProfile(newProfileName.value.trim())
    newProfileName.value = ''
    showCreateForm.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function openManageForm(profileId) {
  showManageForm.value = profileId
  error.value = ''
  await loadManagers(profileId)
}

async function copyManagementCode(profileId, code) {
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    copied.value = profileId
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

async function joinProfile() {
  if (!joinCode.value.trim()) return

  joinError.value = ''
  loading.value = true
  try {
    const profile = await profiles.joinByManagementCode(joinCode.value.trim())
    joinCode.value = ''
    // Load managers for the new profile
    await loadManagers(profile.id)
  } catch (e) {
    joinError.value = e.message
  } finally {
    loading.value = false
  }
}

async function leaveProfile(profileId) {
  if (!confirm('Are you sure you want to leave this profile? You will no longer be able to log entries for them.')) {
    return
  }

  error.value = ''
  loading.value = true
  try {
    await profiles.leaveProfile(profileId)
    delete managers.value[profileId]
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await profiles.fetchProfiles()
  // Load managers for self profile
  if (profiles.selfProfile) {
    await loadManagers(profiles.selfProfile.id)
  }
  // Load managers for all managed profiles
  for (const profile of profiles.managedProfiles) {
    await loadManagers(profile.id)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader :show-calendar="false" />

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg space-y-6">
      <!-- Self profile -->
      <Card v-if="profiles.selfProfile">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{{ getInitials(profiles.selfProfile.name) }}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{{ profiles.selfProfile.name }}</CardTitle>
                <CardDescription>Your profile</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="flex flex-col items-center gap-0.5 h-auto py-1 px-2"
              @click="openManageForm(profiles.selfProfile.id)"
            >
              <Users class="h-4 w-4" />
              <span class="text-[10px]">Manage</span>
            </Button>
          </div>
        </CardHeader>
        <!-- Manage form for self profile -->
        <CardContent v-if="showManageForm === profiles.selfProfile.id" class="border-t pt-4 space-y-4">
          <div class="space-y-2">
            <Label>Current managers</Label>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="manager in managers[profiles.selfProfile.id]"
                :key="manager.id"
                class="text-xs bg-muted px-2 py-1 rounded"
              >
                {{ manager.name }}
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Management code</Label>
            <p class="text-xs text-muted-foreground">Share this code with someone to let them co-manage your profile</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 bg-muted px-3 py-2 rounded text-center font-mono">
                {{ profiles.selfProfile.management_code }}
              </code>
              <Button variant="outline" size="icon" @click="copyManagementCode(profiles.selfProfile.id, profiles.selfProfile.management_code)">
                <Check v-if="copied === profiles.selfProfile.id" class="h-4 w-4 text-green-500" />
                <Copy v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" @click="showManageForm = null">
            Close
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <!-- Managed profiles -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold flex items-center gap-2">
            <Users class="h-4 w-4" />
            Managed Profiles
          </h2>
          <Button variant="outline" size="sm" @click="showCreateForm = true">
            <Plus class="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <!-- Create form -->
        <Card v-if="showCreateForm">
          <CardHeader>
            <CardTitle class="text-lg">Create Profile</CardTitle>
            <CardDescription>Create a profile for someone you want to log entries for</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="name">Name</Label>
              <Input
                id="name"
                :model-value="newProfileName"
                @update:model-value="(val) => newProfileName = val"
                placeholder="e.g., Emma"
              />
            </div>
            <div v-if="error" class="text-sm text-destructive">{{ error }}</div>
            <div class="flex gap-2">
              <Button @click="createProfile" :disabled="loading || !newProfileName.trim()">
                Create
              </Button>
              <Button variant="outline" @click="showCreateForm = false">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Empty state -->
        <p v-if="!profiles.managedProfiles.length && !showCreateForm" class="text-sm text-muted-foreground text-center py-4">
          No managed profiles yet. Create one to log entries for a child or family member.
        </p>

        <!-- Profile cards -->
        <Card v-for="profile in profiles.managedProfiles" :key="profile.id">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ getInitials(profile.name) }}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle class="text-base">{{ profile.name }}</CardTitle>
                  <CardDescription>
                    {{ managers[profile.id]?.length || 1 }} manager(s)
                  </CardDescription>
                </div>
              </div>
              <div class="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex flex-col items-center gap-0.5 h-auto py-1 px-2"
                  @click="openManageForm(profile.id)"
                >
                  <Users class="h-4 w-4" />
                  <span class="text-[10px]">Manage</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex flex-col items-center gap-0.5 h-auto py-1 px-2 text-destructive"
                  @click="leaveProfile(profile.id)"
                  :disabled="managers[profile.id]?.length <= 1"
                >
                  <LogOut class="h-4 w-4" />
                  <span class="text-[10px]">Leave</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <!-- Manage form -->
          <CardContent v-if="showManageForm === profile.id" class="border-t pt-4 space-y-4">
            <div class="space-y-2">
              <Label>Current managers</Label>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="manager in managers[profile.id]"
                  :key="manager.id"
                  class="text-xs bg-muted px-2 py-1 rounded"
                >
                  {{ manager.name }}
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Management code</Label>
              <p class="text-xs text-muted-foreground">Share this code with someone to let them co-manage this profile</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 bg-muted px-3 py-2 rounded text-center font-mono">
                  {{ profile.management_code }}
                </code>
                <Button variant="outline" size="icon" @click="copyManagementCode(profile.id, profile.management_code)">
                  <Check v-if="copied === profile.id" class="h-4 w-4 text-green-500" />
                  <Copy v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div v-if="error" class="text-sm text-destructive">{{ error }}</div>

            <Button variant="outline" size="sm" @click="showManageForm = null">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Error display -->
      <div v-if="error && !showCreateForm && !showManageForm" class="text-sm text-destructive text-center">
        {{ error }}
      </div>

      <Separator />

      <!-- Join a profile -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg flex items-center gap-2">
            <UserPlus class="h-5 w-5" />
            Join a Profile
          </CardTitle>
          <CardDescription>Enter a management code to become a co-manager</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex gap-2">
            <Input
              :model-value="joinCode"
              @update:model-value="(val) => joinCode = val"
              placeholder="MGR-XXXX-XXXX"
              class="flex-1 font-mono"
              @keyup.enter="joinProfile"
            />
            <Button @click="joinProfile" :disabled="loading || !joinCode.trim()">
              Join
            </Button>
          </div>
          <p v-if="joinError" class="text-sm text-destructive">{{ joinError }}</p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
