import { ref, onUnmounted } from 'vue'

const MAX_DURATION = 120 // 2 minutes in seconds

export function useAudioRecorder() {
  const isRecording = ref(false)
  const isPaused = ref(false)
  const audioBlob = ref(null)
  const audioUrl = ref(null)
  const duration = ref(0)
  const error = ref(null)

  let mediaRecorder = null
  let chunks = []
  let stream = null
  let timer = null

  async function startRecording() {
    error.value = null
    audioBlob.value = null
    audioUrl.value = null
    duration.value = 0
    chunks = []

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        audioBlob.value = blob
        audioUrl.value = URL.createObjectURL(blob)
        cleanup()
      }

      mediaRecorder.onerror = (e) => {
        error.value = 'Recording failed: ' + e.error?.message || 'Unknown error'
        cleanup()
      }

      mediaRecorder.start(1000) // Collect data every second
      isRecording.value = true
      isPaused.value = false

      // Duration timer with auto-stop at max
      timer = setInterval(() => {
        duration.value++
        if (duration.value >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        error.value = 'Microphone access denied. Please allow microphone access and try again.'
      } else if (err.name === 'NotFoundError') {
        error.value = 'No microphone found. Please connect a microphone and try again.'
      } else {
        error.value = 'Could not start recording: ' + err.message
      }
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    isRecording.value = false
    isPaused.value = false
    clearInterval(timer)
    timer = null
  }

  function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      isPaused.value = true
      clearInterval(timer)
    }
  }

  function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      isPaused.value = false
      timer = setInterval(() => {
        duration.value++
        if (duration.value >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)
    }
  }

  function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    cleanup()
    audioBlob.value = null
    audioUrl.value = null
    duration.value = 0
    isRecording.value = false
    isPaused.value = false
  }

  function clearRecording() {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }
    audioBlob.value = null
    audioUrl.value = null
    duration.value = 0
    error.value = null
  }

  function cleanup() {
    clearInterval(timer)
    timer = null

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }
  }

  // Clean up on unmount
  onUnmounted(() => {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }
    cleanup()
  })

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    error,
    maxDuration: MAX_DURATION,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    clearRecording
  }
}
