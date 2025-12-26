<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Lightbulb, Check, X, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps({
  suggestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accept', 'decline'])

const expanded = ref(false)

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function handleAccept(suggestionId) {
  emit('accept', suggestionId)
}

function handleDecline(suggestionId) {
  emit('decline', suggestionId)
}
</script>

<template>
  <Card v-if="suggestions.length > 0" class="border-primary/30 bg-primary/5">
    <CardContent class="py-4">
      <!-- Header -->
      <button
        class="w-full flex items-center justify-between"
        @click="expanded = !expanded"
      >
        <div class="flex items-center gap-2">
          <Lightbulb class="h-5 w-5 text-primary" />
          <span class="font-medium">
            {{ suggestions.length }} suggestion{{ suggestions.length !== 1 ? 's' : '' }} for today
          </span>
        </div>
        <ChevronDown v-if="!expanded" class="h-5 w-5 text-muted-foreground" />
        <ChevronUp v-else class="h-5 w-5 text-muted-foreground" />
      </button>

      <!-- Expanded list -->
      <div v-if="expanded" class="mt-4 space-y-3">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="flex items-start gap-3 p-3 bg-background rounded-lg"
        >
          <Avatar class="h-8 w-8 flex-shrink-0">
            <AvatarFallback class="text-xs">
              {{ getInitials(suggestion.fromProfile?.name) }}
            </AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-muted-foreground">
              From <strong>{{ suggestion.fromProfile?.name }}</strong>
            </p>
            <p class="mt-1">{{ suggestion.content }}</p>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              @click.stop="handleAccept(suggestion.id)"
              :disabled="loading"
              title="Accept suggestion"
            >
              <Check class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              @click.stop="handleDecline(suggestion.id)"
              :disabled="loading"
              title="Decline suggestion"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
