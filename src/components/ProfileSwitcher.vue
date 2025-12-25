<script setup>
import { useProfilesStore } from '@/stores/profiles'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users } from 'lucide-vue-next'

const profiles = useProfilesStore()

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
</script>

<template>
  <div v-if="profiles.profiles.length > 1" class="flex items-center gap-2">
    <Select
      :model-value="profiles.activeProfileId"
      @update:model-value="handleSelect"
    >
      <SelectTrigger class="w-[180px]">
        <div class="flex items-center gap-2">
          <Avatar class="h-6 w-6">
            <AvatarFallback class="text-xs">
              {{ profiles.activeProfile ? getInitials(profiles.activeProfile.name) : '?' }}
            </AvatarFallback>
          </Avatar>
          <SelectValue placeholder="Select profile" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="profile in profiles.profiles"
          :key="profile.id"
          :value="profile.id"
        >
          <div class="flex items-center gap-2">
            <span>{{ profile.name }}</span>
            <span v-if="profile.is_managed" class="text-xs text-muted-foreground">(managed)</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div v-else-if="profiles.activeProfile" class="flex items-center gap-2 text-sm text-muted-foreground">
    <Avatar class="h-6 w-6">
      <AvatarFallback class="text-xs">
        {{ getInitials(profiles.activeProfile.name) }}
      </AvatarFallback>
    </Avatar>
    <span>{{ profiles.activeProfile.name }}</span>
  </div>
</template>
