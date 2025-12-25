<script setup>
import { useRouter } from 'vue-router'
import { useProfilesStore } from '@/stores/profiles'
import { useAuthStore } from '@/stores/auth'
import { useEntriesStore } from '@/stores/entries'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronDown, Check, Users, Settings, LogOut } from 'lucide-vue-next'

const router = useRouter()
const profiles = useProfilesStore()
const auth = useAuthStore()
const entries = useEntriesStore()

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function handleSelect(profileId) {
  profiles.setActiveProfile(profileId)
}

function goToManageProfiles() {
  router.push('/profiles')
}

function goToSettings() {
  router.push('/settings')
}

function logout() {
  auth.logout()
  entries.clear()
  router.push('/login')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors outline-none">
      <Avatar class="h-8 w-8">
        <AvatarFallback class="text-sm bg-primary/10 text-primary">
          {{ profiles.activeProfile ? getInitials(profiles.activeProfile.name) : '?' }}
        </AvatarFallback>
      </Avatar>
      <div class="text-left">
        <div class="text-sm font-medium">{{ profiles.activeProfile?.name || 'Select profile' }}</div>
        <div v-if="profiles.activeProfile?.is_managed" class="text-xs text-muted-foreground">Managed profile</div>
      </div>
      <ChevronDown class="h-4 w-4 text-muted-foreground" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-56">
      <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="profile in profiles.profiles"
        :key="profile.id"
        @click="handleSelect(profile.id)"
        class="flex items-center justify-between cursor-pointer"
      >
        <div class="flex items-center gap-2">
          <Avatar class="h-6 w-6">
            <AvatarFallback class="text-xs">{{ getInitials(profile.name) }}</AvatarFallback>
          </Avatar>
          <div>
            <span>{{ profile.name }}</span>
            <span v-if="profile.is_managed" class="text-xs text-muted-foreground ml-1">(managed)</span>
          </div>
        </div>
        <Check v-if="profile.id === profiles.activeProfileId" class="h-4 w-4 text-primary" />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="goToManageProfiles" class="cursor-pointer">
        <Users class="h-4 w-4 mr-2" />
        Manage Profiles
      </DropdownMenuItem>
      <DropdownMenuItem @click="goToSettings" class="cursor-pointer">
        <Settings class="h-4 w-4 mr-2" />
        Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="logout" class="cursor-pointer text-destructive">
        <LogOut class="h-4 w-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
