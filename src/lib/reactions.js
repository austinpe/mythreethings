// Fixed emoji set for reactions
export const REACTIONS = [
  { code: 'heart', emoji: '❤️', label: 'Love' },
  { code: 'laugh', emoji: '😂', label: 'Haha' },
  { code: 'wow', emoji: '😮', label: 'Wow' },
  { code: 'sad', emoji: '😢', label: 'Sad' },
  { code: 'pray', emoji: '🙏', label: 'Thanks' },
  { code: 'celebrate', emoji: '🎉', label: 'Celebrate' }
]

export function getEmojiByCode(code) {
  return REACTIONS.find(r => r.code === code)?.emoji || '❤️'
}

export function getCodeByEmoji(emoji) {
  return REACTIONS.find(r => r.emoji === emoji)?.code || 'heart'
}
