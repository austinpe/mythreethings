<script setup>
import { ref, watch, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import ThingMediaInput from '@/components/ThingMediaInput.vue'
import ThingMediaPreview from '@/components/ThingMediaPreview.vue'
import ThingMediaDisplay from '@/components/ThingMediaDisplay.vue'
import { processMediaFile } from '@/lib/mediaUtils'
import { X, Paperclip, Camera, Mic } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  // The saved thing record (for displaying existing media)
  thing: {
    type: Object,
    default: null
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
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'remove', 'media-select', 'media-remove'])

const localValue = ref(props.modelValue)
const mode = ref('text') // 'text' | 'image' | 'audio'
const pendingMedia = ref(null) // { file: File|Blob, mediaType: string }
const mediaError = ref(null)
const isProcessing = ref(false)
const showRemoveDialog = ref(false)
const removeType = ref(null) // 'pending' | 'existing'

// If thing already has media, show it
const hasExistingMedia = computed(() => props.thing?.media_type && props.thing?.media)

// Determine what to show
const showTextInput = computed(() => mode.value === 'text' && !pendingMedia.value && !hasExistingMedia.value)
const showMediaInput = computed(() => (mode.value === 'image' || mode.value === 'audio') && !pendingMedia.value && !hasExistingMedia.value)
const showMediaPreview = computed(() => pendingMedia.value !== null)
const showExistingMedia = computed(() => hasExistingMedia.value && !pendingMedia.value)

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// Reset to text mode when value changes externally
watch(() => props.modelValue, (newVal) => {
  if (newVal && mode.value !== 'text') {
    mode.value = 'text'
    pendingMedia.value = null
  }
})

// Clear pending media when thing gets saved with media
watch(() => props.thing?.media, (newMedia) => {
  if (newMedia && pendingMedia.value) {
    pendingMedia.value = null
    mode.value = 'text'
  }
})

function handleInput(val) {
  localValue.value = val
  emit('update:modelValue', val)
}

function handleFocus() {
  emit('focus')
}

function handleBlur() {
  emit('blur', localValue.value)
}

function setMode(newMode) {
  mode.value = newMode
  mediaError.value = null
  // Clear text when switching away from text mode
  if (newMode !== 'text' && localValue.value) {
    localValue.value = ''
    emit('update:modelValue', '')
  }
}

async function handleMediaSelect({ file, mediaType }) {
  mediaError.value = null
  isProcessing.value = true

  try {
    // Process (compress images, validate)
    const processed = await processMediaFile(file)
    pendingMedia.value = {
      file: processed.file,
      mediaType: processed.mediaType
    }

    // Emit for saving
    emit('media-select', pendingMedia.value)
  } catch (err) {
    mediaError.value = err.message
  } finally {
    isProcessing.value = false
  }
}

function handleMediaError(errorMsg) {
  mediaError.value = errorMsg
}

function openRemoveDialog(type) {
  removeType.value = type
  showRemoveDialog.value = true
}

function confirmRemove() {
  const type = removeType.value

  if (type === 'pending') {
    pendingMedia.value = null
    mode.value = 'text'
  } else if (type === 'existing') {
    mode.value = 'text'
    emit('media-remove')
  }

  // Close dialog after action
  showRemoveDialog.value = false
  removeType.value = null
}

function cancelRemove() {
  showRemoveDialog.value = false
  removeType.value = null
}
</script>

<template>
  <div class="space-y-2">
    <!-- Main row with number badge -->
    <div class="flex items-start gap-2">
      <!-- Number badge -->
      <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium mt-1">
        {{ index + 1 }}
      </span>

      <!-- Content area -->
      <div class="flex-1 min-w-0">
        <!-- Text input with media dropdown -->
        <div v-if="showTextInput" class="flex gap-2">
          <Input
            :model-value="localValue"
            @update:model-value="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            :placeholder="placeholder"
            :disabled="disabled"
            spellcheck="true"
            class="flex-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
                :disabled="disabled"
              >
                <Paperclip class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="setMode('image')">
                <Camera class="h-4 w-4 mr-2" />
                Photo / Video
              </DropdownMenuItem>
              <DropdownMenuItem @click="setMode('audio')">
                <Mic class="h-4 w-4 mr-2" />
                Voice recording
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Media input (capture/select) -->
        <div v-if="showMediaInput" class="space-y-2">
          <ThingMediaInput
            :mode="mode"
            :disabled="disabled || isProcessing"
            @select="handleMediaSelect"
            @error="handleMediaError"
          />
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground"
            @click="setMode('text')"
          >
            ← Back to text
          </Button>
        </div>

        <!-- Media preview (pending upload) -->
        <div v-if="showMediaPreview" class="flex gap-2">
          <div class="flex-1 min-w-0">
            <ThingMediaPreview
              :file="pendingMedia.file"
              :media-type="pendingMedia.mediaType"
              :show-remove="false"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
            @click="openRemoveDialog('pending')"
            title="Remove media"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Existing saved media -->
        <div v-if="showExistingMedia" class="flex gap-2">
          <div class="flex-1 min-w-0">
            <ThingMediaDisplay :record="thing" />
          </div>
          <Button
            v-if="!disabled"
            variant="ghost"
            size="icon"
            class="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
            @click="openRemoveDialog('existing')"
            title="Remove media"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Processing indicator -->
        <p v-if="isProcessing" class="text-sm text-muted-foreground">
          Processing...
        </p>

        <!-- Error display -->
        <p v-if="mediaError" class="text-sm text-destructive">
          {{ mediaError }}
        </p>
      </div>

      <!-- Remove button -->
      <Button
        v-if="canRemove"
        variant="ghost"
        size="icon"
        class="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
        @click="$emit('remove')"
        :disabled="disabled"
      >
        <X class="h-4 w-4" />
      </Button>
      <div v-else class="w-8 flex-shrink-0" />
    </div>

    <!-- Remove confirmation dialog -->
    <AlertDialog :open="showRemoveDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove media?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the media from this entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelRemove">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmRemove" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
