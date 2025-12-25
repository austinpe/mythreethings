// Character set that avoids confusing chars like 0/O, 1/I
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomChars(count) {
  let result = ''
  for (let i = 0; i < count; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return result
}

// Generate a share code (e.g., "ABC-123-XYZ")
export function generateShareCode() {
  return `${randomChars(3)}-${randomChars(3)}-${randomChars(3)}`
}

// Generate a management code (e.g., "MGR-ABCD-1234")
export function generateManagementCode() {
  return `MGR-${randomChars(4)}-${randomChars(4)}`
}
