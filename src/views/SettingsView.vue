<script setup>
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Home, Moon, Sun, Monitor } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const { mode, setMode } = useTheme()

function handleModeChange(value) {
  setMode(value)
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" @click="router.push('/')">
          <Home class="h-5 w-5" />
        </Button>
        <h1 class="font-semibold">Settings</h1>
        <div class="w-10" />
      </div>
    </header>

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
        </CardContent>
      </Card>

      <!-- Account -->
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{{ auth.user?.email }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" class="w-full" @click="logout">
            Sign out
          </Button>
        </CardContent>
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
