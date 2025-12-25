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
import { Plus, UserPlus, LogOut, Users } from 'lucide-vue-next'

const profiles = useProfilesStore()

const showCreateForm = ref(false)
const showInviteForm = ref(null) // profile id or null
const newProfileName = ref('')
const inviteEmail = ref('')
const managers = ref({}) // { profileId: [managers] }
const error = ref('')
const loading = ref(false)

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

async function openInviteForm(profileId) {
  showInviteForm.value = profileId
  inviteEmail.value = ''
  error.value = ''
  await loadManagers(profileId)
}

async function inviteUser() {
  if (!inviteEmail.value.trim() || !showInviteForm.value) return

  error.value = ''
  loading.value = true
  try {
    await profiles.inviteManager(showInviteForm.value, inviteEmail.value.trim())
    // Reload managers
    managers.value[showInviteForm.value] = await profiles.getProfileManagers(showInviteForm.value)
    inviteEmail.value = ''
  } catch (e) {
    error.value = e.message
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
          <div class="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{{ getInitials(profiles.selfProfile.name) }}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{{ profiles.selfProfile.name }}</CardTitle>
              <CardDescription>Your profile</CardDescription>
            </div>
          </div>
        </CardHeader>
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
                  @click="openInviteForm(profile.id)"
                >
                  <UserPlus class="h-4 w-4" />
                  <span class="text-[10px]">Invite</span>
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

          <!-- Invite form -->
          <CardContent v-if="showInviteForm === profile.id" class="border-t pt-4 space-y-4">
            <div class="space-y-2">
              <Label>Current managers</Label>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="manager in managers[profile.id]"
                  :key="manager.id"
                  class="text-xs bg-muted px-2 py-1 rounded"
                >
                  {{ manager.user?.email || 'Unknown' }}
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="invite-email">Invite by email</Label>
              <div class="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  :model-value="inviteEmail"
                  @update:model-value="(val) => inviteEmail = val"
                  placeholder="parent@example.com"
                  class="flex-1"
                />
                <Button @click="inviteUser" :disabled="loading || !inviteEmail.trim()">
                  Invite
                </Button>
              </div>
            </div>

            <div v-if="error" class="text-sm text-destructive">{{ error }}</div>

            <Button variant="outline" size="sm" @click="showInviteForm = null">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Error display -->
      <div v-if="error && !showCreateForm && !showInviteForm" class="text-sm text-destructive text-center">
        {{ error }}
      </div>
    </main>
  </div>
</template>
