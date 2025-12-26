<script setup>
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { REACTIONS } from '@/lib/reactions'
import { SmilePlus } from 'lucide-vue-next'

const props = defineProps({
  currentEmoji: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

function handleSelect(code) {
  emit('select', code)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-muted-foreground hover:text-foreground"
        :disabled="disabled"
      >
        <span v-if="currentEmoji" class="text-base">{{ currentEmoji }}</span>
        <SmilePlus v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="min-w-0 p-1">
      <div class="flex gap-1">
        <button
          v-for="reaction in REACTIONS"
          :key="reaction.code"
          @click="handleSelect(reaction.code)"
          class="p-1.5 text-xl hover:bg-muted rounded transition-colors"
          :class="{ 'bg-primary/20': currentEmoji === reaction.emoji }"
          :title="reaction.label"
        >
          {{ reaction.emoji }}
        </button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
