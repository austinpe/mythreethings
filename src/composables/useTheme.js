import { ref, watch } from 'vue'

const THEME_MODE_KEY = 'theme-mode'
const THEME_COLOR_KEY = 'theme-color'
const THEME_TIMEZONE_KEY = 'theme-timezone'

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

// Shared state across all useTheme() calls
const mode = ref(localStorage.getItem(THEME_MODE_KEY) || 'system')
const color = ref(localStorage.getItem(THEME_COLOR_KEY) || 'violet')
const timezone = ref(localStorage.getItem(THEME_TIMEZONE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone)

// Track if we've set up the system theme listener
let systemThemeListenerSetup = false

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

export function useTheme() {
  // Set up system theme change listener once
  if (!systemThemeListenerSetup) {
    systemThemeListenerSetup = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme()
      }
    })
    // Apply theme on initial load
    applyTheme()
  }

  function setMode(newMode, saveToLocalStorage = true) {
    mode.value = newMode
    if (saveToLocalStorage) {
      localStorage.setItem(THEME_MODE_KEY, newMode)
    }
    applyTheme()
  }

  function setColor(newColor, saveToLocalStorage = true) {
    color.value = newColor
    if (saveToLocalStorage) {
      localStorage.setItem(THEME_COLOR_KEY, newColor)
    }
    applyTheme()
  }

  function setTimezone(newTimezone, saveToLocalStorage = true) {
    timezone.value = newTimezone
    if (saveToLocalStorage) {
      localStorage.setItem(THEME_TIMEZONE_KEY, newTimezone)
    }
  }

  // Load settings from a profile's settings object
  function loadFromProfile(settings) {
    if (!settings) return

    if (settings.theme_mode) {
      setMode(settings.theme_mode, false)
    }
    if (settings.theme_color) {
      setColor(settings.theme_color, false)
    }
    if (settings.timezone) {
      setTimezone(settings.timezone, false)
    }
  }

  // Get current settings as an object (for saving to profile)
  function getSettings() {
    return {
      theme_mode: mode.value,
      theme_color: color.value,
      timezone: timezone.value
    }
  }

  return {
    mode,
    color,
    timezone,
    setMode,
    setColor,
    setTimezone,
    loadFromProfile,
    getSettings,
    applyTheme
  }
}
