<script setup>
import { computed } from 'vue'
import { getEmojiByCode } from '@/lib/reactions'

const props = defineProps({
  // Object of { emojiCode: count }
  reactions: {
    type: Object,
    default: () => ({})
  },
  // Object of { emojiCode: ['Name1', 'Name2'] } for tooltips
  reactionNames: {
    type: Object,
    default: () => ({})
  }
})

// Convert to sorted array for display
const reactionList = computed(() => {
  return Object.entries(props.reactions)
    .filter(([_, count]) => count > 0)
    .map(([code, count]) => ({
      code,
      emoji: getEmojiByCode(code),
      count,
      names: props.reactionNames[code] || []
    }))
    .sort((a, b) => b.count - a.count)
})

const hasReactions = computed(() => reactionList.value.length > 0)

function getTooltip(names) {
  if (!names || names.length === 0) return ''
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
}
</script>

<template>
  <div v-if="hasReactions" class="flex items-center gap-1.5 text-sm">
    <span
      v-for="reaction in reactionList"
      :key="reaction.code"
      class="inline-flex items-center gap-0.5 text-muted-foreground cursor-default"
      :title="getTooltip(reaction.names)"
    >
      <span class="text-base">{{ reaction.emoji }}</span>
      <span class="text-xs">{{ reaction.count }}</span>
    </span>
  </div>
</template>
