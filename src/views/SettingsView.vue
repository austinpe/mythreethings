<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useProfilesStore } from '@/stores/profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import AppHeader from '@/components/AppHeader.vue'
import { Moon, Sun, Monitor, Globe } from 'lucide-vue-next'

const auth = useAuthStore()
const profiles = useProfilesStore()
const { mode, setMode, color, setColor, timezone, setTimezone, getSettings } = useTheme()

const themeColors = [
  { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' }
]

// Common timezones for the selector
const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
]

const isManaged = computed(() => profiles.activeProfile?.is_managed ?? false)
const profileName = computed(() => profiles.activeProfile?.name ?? 'Your')

async function saveToProfile() {
  if (!profiles.activeProfile) return
  await profiles.updateProfileSettings(profiles.activeProfile.id, getSettings())
}

async function handleModeChange(value) {
  setMode(value, false) // Don't save to localStorage
  await saveToProfile()
}

async function handleColorChange(value) {
  setColor(value, false) // Don't save to localStorage
  await saveToProfile()
}

async function handleTimezoneChange(value) {
  setTimezone(value, false) // Don't save to localStorage
  await saveToProfile()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader :show-calendar="false" />

    <!-- Managed profile banner -->
    <div v-if="isManaged" class="bg-primary/10 border-b border-primary/20">
      <div class="container mx-auto px-4 py-2 text-center text-sm text-primary">
        Editing settings for <strong>{{ profileName }}</strong>
      </div>
    </div>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-6 max-w-lg space-y-6">
      <!-- Appearance -->
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Theme Mode</Label>
            <Select :model-value="mode" @update:model-value="handleModeChange">
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div class="flex items-center gap-2">
                    <Sun class="h-4 w-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div class="flex items-center gap-2">
                    <Moon class="h-4 w-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div class="flex items-center gap-2">
                    <Monitor class="h-4 w-4" />
                    <span>System</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Theme Color</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="themeColor in themeColors"
                :key="themeColor.value"
                @click="handleColorChange(themeColor.value)"
                class="w-8 h-8 rounded-full border-2 transition-all"
                :class="{
                  'border-foreground scale-110': color === themeColor.value,
                  'border-transparent hover:scale-105': color !== themeColor.value
                }"
                :style="{ backgroundColor: themeColor.hex }"
                :title="themeColor.label"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Region -->
      <Card>
        <CardHeader>
          <CardTitle>Region</CardTitle>
          <CardDescription>Date and time preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label>Timezone</Label>
            <Select :model-value="timezone" @update:model-value="handleTimezoneChange">
              <SelectTrigger>
                <div class="flex items-center gap-2">
                  <Globe class="h-4 w-4" />
                  <SelectValue placeholder="Select timezone" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tz in timezones" :key="tz.value" :value="tz.value">
                  {{ tz.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Account -->
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{{ auth.user?.email }}</CardDescription>
        </CardHeader>
      </Card>

      <!-- About -->
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          <p>My Three Things v1.1</p>
          <p class="mt-2">A simple gratitude journaling app to help you reflect on the good things in your day.</p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
