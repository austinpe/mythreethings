<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/mediaUtils'
import { X, Play, Pause } from 'lucide-vue-next'

const props = defineProps({
  file: {
    type: [File, Blob],
    required: true
  },
  mediaType: {
    type: String, // 'image' | 'audio' | 'video'
    required: true
  },
  showRemove: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['remove'])

const previewUrl = ref(null)
const isPlaying = ref(false)
const audioElement = ref(null)
const videoElement = ref(null)
const currentTime = ref(0)
const audioDuration = ref(0)

// Create preview URL
onMounted(() => {
  previewUrl.value = URL.createObjectURL(props.file)
})

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

// Handle file changes
watch(() => props.file, (newFile) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(newFile)
  isPlaying.value = false
  currentTime.value = 0
})

const progress = computed(() => {
  if (audioDuration.value === 0) return 0
  return (currentTime.value / audioDuration.value) * 100
})

const fileSize = computed(() => formatFileSize(props.file.size))

function toggleAudioPlay() {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
}

function toggleVideoPlay() {
  if (!videoElement.value) return

  if (isPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play()
  }
}

function onAudioTimeUpdate() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
    // WebM audio may not have duration until playing
    if (audioElement.value.duration && isFinite(audioElement.value.duration)) {
      audioDuration.value = audioElement.value.duration
    }
  }
}

function onAudioLoadedMetadata() {
  if (audioElement.value && isFinite(audioElement.value.duration)) {
    audioDuration.value = audioElement.value.duration
  }
}

function onAudioEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function onVideoPlay() {
  isPlaying.value = true
}

function onVideoPause() {
  isPlaying.value = false
}

function formatTime(seconds, allowZero = true) {
  if (!isFinite(seconds) || isNaN(seconds)) return '--:--'
  if (!allowZero && seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="relative rounded-lg overflow-hidden bg-muted">
    <!-- Image preview -->
    <div v-if="mediaType === 'image'" class="relative">
      <img
        :src="previewUrl"
        alt="Preview"
        class="max-h-48 w-full object-contain bg-black/5"
      />
      <div class="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
        {{ fileSize }}
      </div>
    </div>

    <!-- Video preview -->
    <div v-else-if="mediaType === 'video'" class="relative">
      <video
        ref="videoElement"
        :src="previewUrl"
        class="max-h-48 w-full object-contain bg-black"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="isPlaying = false"
        playsinline
      />
      <button
        v-if="!isPlaying"
        @click="toggleVideoPlay"
        class="absolute inset-0 flex items-center justify-center bg-black/20"
      >
        <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
          <Play class="h-6 w-6 text-black ml-1" />
        </div>
      </button>
      <div class="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
        {{ fileSize }}
      </div>
    </div>

    <!-- Audio preview -->
    <div v-else-if="mediaType === 'audio'" class="p-4 flex items-center gap-3">
      <audio
        ref="audioElement"
        :src="previewUrl"
        @timeupdate="onAudioTimeUpdate"
        @loadedmetadata="onAudioLoadedMetadata"
        @ended="onAudioEnded"
        @play="isPlaying = true"
        @pause="isPlaying = false"
      />

      <Button
        variant="ghost"
        size="icon"
        @click="toggleAudioPlay"
        class="h-10 w-10 flex-shrink-0"
      >
        <Play v-if="!isPlaying" class="h-5 w-5" />
        <Pause v-else class="h-5 w-5" />
      </Button>

      <div class="flex-1 space-y-1">
        <div class="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all"
            :style="{ width: progress + '%' }"
          />
        </div>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ fileSize }}</span>
        </div>
      </div>
    </div>

    <!-- Remove button -->
    <Button
      v-if="showRemove"
      variant="ghost"
      size="icon"
      class="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
      @click="$emit('remove')"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>
</template>
