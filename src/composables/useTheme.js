import { ref, onMounted } from 'vue'

const THEME_MODE_KEY = 'theme-mode'
const THEME_COLOR_KEY = 'theme-color'

// Color theme definitions using oklch format to match Tailwind v4
const colorThemes = {
  violet: {
    primary: 'oklch(0.541 0.281 293.009)',
    primaryForeground: 'oklch(0.969 0.016 293.756)',
    ring: 'oklch(0.702 0.183 293.541)'
  },
  blue: {
    primary: 'oklch(0.623 0.214 259.815)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.623 0.214 259.815)'
  },
  green: {
    primary: 'oklch(0.627 0.194 149.214)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.627 0.194 149.214)'
  },
  orange: {
    primary: 'oklch(0.705 0.191 47.604)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.705 0.191 47.604)'
  },
  red: {
    primary: 'oklch(0.637 0.237 25.331)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.637 0.237 25.331)'
  },
  pink: {
    primary: 'oklch(0.656 0.241 354.308)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.656 0.241 354.308)'
  },
  yellow: {
    primary: 'oklch(0.795 0.184 86.047)',
    primaryForeground: 'oklch(0.141 0.005 285.823)',
    ring: 'oklch(0.795 0.184 86.047)'
  }
}

export function useTheme() {
  const mode = ref(localStorage.getItem(THEME_MODE_KEY) || 'system')
  const color = ref(localStorage.getItem(THEME_COLOR_KEY) || 'violet')

  function applyTheme() {
    const root = document.documentElement
    root.classList.remove('dark')

    // Apply dark mode
    if (mode.value === 'dark') {
      root.classList.add('dark')
    } else if (mode.value === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      }
    }

    // Apply color theme
    const themeColors = colorThemes[color.value] || colorThemes.violet
    root.style.setProperty('--primary', themeColors.primary)
    root.style.setProperty('--primary-foreground', themeColors.primaryForeground)
    root.style.setProperty('--ring', themeColors.ring)
  }

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem(THEME_MODE_KEY, newMode)
    applyTheme()
  }

  function setColor(newColor) {
    color.value = newColor
    localStorage.setItem(THEME_COLOR_KEY, newColor)
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
    color,
    setMode,
    setColor,
    applyTheme
  }
}
