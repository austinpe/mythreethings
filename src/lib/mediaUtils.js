// Media validation and compression utilities

// File size limits in bytes
export const MEDIA_LIMITS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  audio: {
    maxSize: 10 * 1024 * 1024, // 10MB
    types: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    extensions: ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.mp4', '.aac']
  },
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    types: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: ['.mp4', '.webm', '.mov']
  }
}

// Compression settings
const COMPRESSION = {
  maxWidth: 1920,
  maxHeight: 1920,
  initialQuality: 0.8,
  retryQuality: 0.6,
  targetSize: 1 * 1024 * 1024 // 1MB target, retry compression if larger
}

/**
 * Detect media type from file
 * @param {File} file
 * @returns {'image' | 'audio' | 'video' | null}
 */
export function detectMediaType(file) {
  const mimeType = (file.type || '').toLowerCase()
  // Extract base MIME type without codec params (e.g., "audio/webm;codecs=opus" -> "audio/webm")
  const baseMimeType = mimeType.split(';')[0]

  if (MEDIA_LIMITS.image.types.includes(baseMimeType)) return 'image'
  if (MEDIA_LIMITS.audio.types.includes(baseMimeType)) return 'audio'
  if (MEDIA_LIMITS.video.types.includes(baseMimeType)) return 'video'

  // Fallback: check extension (only for Files with names, not Blobs)
  if (file.name) {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (MEDIA_LIMITS.image.extensions.includes(ext)) return 'image'
    if (MEDIA_LIMITS.audio.extensions.includes(ext)) return 'audio'
    if (MEDIA_LIMITS.video.extensions.includes(ext)) return 'video'
  }

  return null
}

/**
 * Validate a media file before upload
 * @param {File} file
 * @returns {{ valid: boolean, mediaType: string | null, errors: string[] }}
 */
export function validateMediaFile(file) {
  const errors = []
  const mediaType = detectMediaType(file)

  if (!mediaType) {
    errors.push(`Unsupported file type: ${file.type || 'unknown'}`)
    return { valid: false, mediaType: null, errors }
  }

  const limits = MEDIA_LIMITS[mediaType]

  // Check MIME type (strip codec params like ";codecs=opus")
  const mimeType = (file.type || '').toLowerCase()
  const baseMimeType = mimeType.split(';')[0]
  if (!limits.types.includes(baseMimeType)) {
    // Only check extension if file has a name (Files, not Blobs)
    if (file.name) {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!limits.extensions.includes(ext)) {
        errors.push(`Invalid ${mediaType} format. Supported: ${limits.extensions.join(', ')}`)
      }
    } else {
      errors.push(`Invalid ${mediaType} format: ${baseMimeType || 'unknown'}`)
    }
  }

  // Check file size
  if (file.size > limits.maxSize) {
    const maxMB = limits.maxSize / (1024 * 1024)
    const fileMB = (file.size / (1024 * 1024)).toFixed(1)
    errors.push(`File too large (${fileMB}MB). Maximum for ${mediaType}: ${maxMB}MB`)
  }

  return {
    valid: errors.length === 0,
    mediaType,
    errors
  }
}

/**
 * Compress an image file using Canvas API
 * @param {File} file - Original image file
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      let { width, height } = img

      // Scale down if needed while preserving aspect ratio
      if (width > COMPRESSION.maxWidth || height > COMPRESSION.maxHeight) {
        const ratio = Math.min(
          COMPRESSION.maxWidth / width,
          COMPRESSION.maxHeight / height
        )
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Try initial quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // If still too large, retry with lower quality
          if (blob.size > COMPRESSION.targetSize) {
            canvas.toBlob(
              (retryBlob) => {
                resolve(retryBlob || blob)
              },
              'image/jpeg',
              COMPRESSION.retryQuality
            )
          } else {
            resolve(blob)
          }
        },
        'image/jpeg',
        COMPRESSION.initialQuality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Process a media file - validate and compress if needed
 * @param {File} file
 * @returns {Promise<{ file: File | Blob, mediaType: string }>}
 */
export async function processMediaFile(file) {
  const validation = validateMediaFile(file)

  if (!validation.valid) {
    throw new Error(validation.errors.join('. '))
  }

  const { mediaType } = validation

  // Compress images
  if (mediaType === 'image') {
    const compressed = await compressImage(file)
    return {
      file: compressed,
      mediaType
    }
  }

  // Audio and video pass through as-is
  return {
    file,
    mediaType
  }
}

/**
 * Format file size for display
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Format duration in seconds to MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
