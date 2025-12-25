import { ref, watch, onMounted } from 'vue'

const THEME_KEY = 'theme-mode'

export function useTheme() {
  const mode = ref(localStorage.getItem(THEME_KEY) || 'system')

  function applyTheme() {
    const root = document.documentElement
    root.classList.remove('dark')

    if (mode.value === 'dark') {
      root.classList.add('dark')
    } else if (mode.value === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      }
    }
  }

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem(THEME_KEY, newMode)
    applyTheme()
  }

  // Listen for system theme changes
  onMounted(() => {
    applyTheme()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme()
      }
    })
  })

  return {
    mode,
    setMode,
    applyTheme
  }
}
