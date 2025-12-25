<script setup>
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// Initialize theme on app load
useTheme()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <RouterView />
  </div>
</template>
