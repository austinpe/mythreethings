<script setup>
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  index: {
    type: Number,
    required: true
  },
  canRemove: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: "What are you thankful for?"
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'remove'])

const localValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

function handleInput(val) {
  localValue.value = val
  emit('update:modelValue', val)
}

function handleBlur() {
  emit('blur', localValue.value)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
      {{ index + 1 }}
    </span>
    <Input
      :model-value="localValue"
      @update:model-value="handleInput"
      @blur="handleBlur"
      :placeholder="placeholder"
      class="flex-1"
    />
    <Button
      v-if="canRemove"
      variant="ghost"
      size="icon"
      class="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
      @click="$emit('remove')"
    >
      <X class="h-4 w-4" />
    </Button>
    <div v-else class="w-8" />
  </div>
</template>
