import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pb-3t.imstillwakingup.com/')

/**
 * Get the URL for a file attachment on a record
 * @param {Object} record - The PocketBase record containing the file
 * @param {string} filename - The filename from the record's file field
 * @param {string} [thumb] - Optional thumbnail size (e.g., '100x100', '200x200')
 * @returns {string} The file URL
 */
export function getMediaUrl(record, filename, thumb = null) {
  if (!record || !filename) return ''

  const baseUrl = pb.files.getURL(record, filename)

  if (thumb) {
    return `${baseUrl}?thumb=${thumb}`
  }

  return baseUrl
}

export default pb
