<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Lightbulb } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  targetName: {
    type: String,
    default: ''
  },
  dateStr: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:open', 'submit'])

const content = ref('')
const loading = ref(false)
const error = ref('')

const displayDate = computed(() => {
  if (!props.dateStr) return ''
  const [year, month, day] = props.dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
})

import { computed } from 'vue'

async function handleSubmit() {
  if (!content.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    emit('submit', content.value.trim())
    content.value = ''
    emit('update:open', false)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function handleClose() {
  content.value = ''
  error.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Lightbulb class="h-5 w-5" />
          Suggest Something
        </DialogTitle>
        <DialogDescription>
          Suggest a gratitude item for <strong>{{ targetName }}</strong> on {{ displayDate }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <Textarea
          v-model="content"
          placeholder="e.g., Remember that amazing sunset we saw!"
          rows="3"
          class="resize-none"
          @keydown.meta.enter="handleSubmit"
          @keydown.ctrl.enter="handleSubmit"
        />
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="loading">
          Cancel
        </Button>
        <Button @click="handleSubmit" :disabled="loading || !content.trim()">
          Send Suggestion
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
