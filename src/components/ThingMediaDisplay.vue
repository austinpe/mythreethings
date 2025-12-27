<script setup>
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/lib/pocketbase'
import { Play, Pause } from 'lucide-vue-next'

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
})

const isPlaying = ref(false)
const audioElement = ref(null)
const videoElement = ref(null)
const currentTime = ref(0)
const duration = ref(0)

const mediaUrl = computed(() => {
  if (!props.record.media) return ''
  return getMediaUrl(props.record, props.record.media)
})

const thumbnailUrl = computed(() => {
  if (props.record.media_type !== 'image') return ''
  return getMediaUrl(props.record, props.record.media, '400x400')
})

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

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

function onTimeUpdate(el) {
  currentTime.value = el.currentTime
  // WebM audio may not have duration until playing - update it here too
  if (el.duration && isFinite(el.duration)) {
    duration.value = el.duration
  }
}

function onLoadedMetadata(el) {
  if (el.duration && isFinite(el.duration)) {
    duration.value = el.duration
  }
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function onPlay() {
  isPlaying.value = true
}

function onPause() {
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
  <div class="rounded-lg overflow-hidden bg-muted">
    <!-- Image display -->
    <div v-if="record.media_type === 'image'" class="relative">
      <img
        :src="thumbnailUrl || mediaUrl"
        alt="Gratitude image"
        class="max-h-64 w-full object-contain bg-black/5 cursor-pointer"
        @click="$emit('view', mediaUrl)"
      />
    </div>

    <!-- Video display -->
    <div v-else-if="record.media_type === 'video'" class="relative">
      <video
        ref="videoElement"
        :src="mediaUrl"
        class="max-h-64 w-full object-contain bg-black"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @timeupdate="onTimeUpdate($event.target)"
        @loadedmetadata="onLoadedMetadata($event.target)"
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
    </div>

    <!-- Audio display -->
    <div v-else-if="record.media_type === 'audio'" class="p-4 flex items-center gap-3">
      <audio
        ref="audioElement"
        :src="mediaUrl"
        @timeupdate="onTimeUpdate($event.target)"
        @loadedmetadata="onLoadedMetadata($event.target)"
        @ended="onEnded"
        @play="onPlay"
        @pause="onPause"
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
          <span>{{ formatTime(duration, false) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
