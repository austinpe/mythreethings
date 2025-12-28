<script setup>
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { validateMediaFile, formatDuration } from '@/lib/mediaUtils'
import { Camera, Image as ImageIcon, Mic, Square, X } from 'lucide-vue-next'

const props = defineProps({
  mode: {
    type: String, // 'image' | 'audio'
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'error'])

const cameraInput = ref(null)
const galleryInput = ref(null)
const error = ref(null)

// Audio recording
const recorder = useAudioRecorder()

const isRecording = computed(() => recorder.isRecording.value)
const recordingDuration = computed(() => recorder.duration.value)

// Handle file selection (image or video)
function openCamera() {
  if (cameraInput.value) {
    cameraInput.value.click()
  }
}

function openGallery() {
  if (galleryInput.value) {
    galleryInput.value.click()
  }
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // Reset input so same file can be selected again
  event.target.value = ''

  // Validate
  const validation = validateMediaFile(file)
  if (!validation.valid) {
    error.value = validation.errors.join('. ')
    emit('error', error.value)
    return
  }

  error.value = null
  emit('select', { file, mediaType: validation.mediaType })
}

// Audio recording handlers
async function toggleRecording() {
  if (isRecording.value) {
    recorder.stopRecording()
    // Wait a tick for the blob to be ready
    setTimeout(() => {
      if (recorder.audioBlob.value) {
        emit('select', {
          file: recorder.audioBlob.value,
          mediaType: 'audio'
        })
      }
    }, 100)
  } else {
    await recorder.startRecording()
    if (recorder.error.value) {
      error.value = recorder.error.value
      emit('error', error.value)
    }
  }
}

function cancelRecording() {
  recorder.cancelRecording()
}

// Get accept types based on mode
const acceptTypes = computed(() => {
  if (props.mode === 'image') {
    return 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
  }
  return ''
})
</script>

<template>
  <div class="space-y-2">
    <!-- Image/Video mode -->
    <div v-if="mode === 'image'" class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        @click="openCamera"
        :disabled="disabled"
        class="flex-1"
      >
        <Camera class="h-4 w-4 mr-2" />
        Camera
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="openGallery"
        :disabled="disabled"
        class="flex-1"
      >
        <ImageIcon class="h-4 w-4 mr-2" />
        Gallery
      </Button>
      <!-- Camera input - uses capture to open camera directly -->
      <input
        ref="cameraInput"
        type="file"
        :accept="acceptTypes"
        capture="environment"
        class="hidden"
        @change="handleFileSelect"
      />
      <!-- Gallery input - no capture, opens file picker -->
      <input
        ref="galleryInput"
        type="file"
        :accept="acceptTypes"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Audio mode -->
    <div v-else-if="mode === 'audio'" class="flex items-center gap-3">
      <Button
        :variant="isRecording ? 'destructive' : 'outline'"
        size="sm"
        @click="toggleRecording"
        :disabled="disabled"
        class="flex-1"
      >
        <Mic v-if="!isRecording" class="h-4 w-4 mr-2" />
        <Square v-else class="h-4 w-4 mr-2" />
        {{ isRecording ? 'Stop' : 'Record' }}
      </Button>

      <span v-if="isRecording" class="text-sm text-muted-foreground tabular-nums">
        {{ formatDuration(recordingDuration) }} / {{ formatDuration(recorder.maxDuration) }}
      </span>

      <Button
        v-if="isRecording"
        variant="ghost"
        size="icon"
        @click="cancelRecording"
        class="h-8 w-8"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Error display -->
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>
