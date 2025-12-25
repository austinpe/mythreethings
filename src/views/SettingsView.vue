<script setup>
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
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
import { Moon, Sun, Monitor } from 'lucide-vue-next'

const auth = useAuthStore()
const { mode, setMode, color, setColor } = useTheme()

const themeColors = [
  { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' }
]

function handleModeChange(value) {
  setMode(value)
}

function handleColorChange(value) {
  setColor(value)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader :show-calendar="false" />

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
          <p>My Three Things v1.0</p>
          <p class="mt-2">A simple gratitude journaling app to help you reflect on the good things in your day.</p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
