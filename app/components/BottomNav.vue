<script setup lang="ts">
const route = useRoute()
const store = useAppStore()

const tabs = [
  { label: 'Systems', icon: 'i-heroicons-book-open', activeIcon: 'i-heroicons-book-open', to: '/' },
  { label: 'Session', icon: 'i-heroicons-play', activeIcon: 'i-heroicons-play-solid', to: '/session' },
  { label: 'Display', icon: 'i-heroicons-tv', activeIcon: 'i-heroicons-tv', to: '/display' },
]

function isActive(tab: { to: string }) {
  if (tab.to === '/') return route.path === '/' || route.path.startsWith('/systems')
  return route.path === tab.to
}

const isDisplayPage = computed(() => route.path === '/display')
const showToggleButton = computed(() => isDisplayPage.value)
const shouldHideNav = computed(() => showToggleButton.value && store.navCollapsed)

function handleFullscreenChange() {
  store.setFullscreen(!!document.fullscreenElement)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'F11' && isDisplayPage.value) {
    e.preventDefault()
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Floating toggle button — always visible when fullscreen on display page -->
  <button
    v-if="showToggleButton"
    class="fixed bottom-3 left-3 z-[60] flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900/90 text-gray-500 backdrop-blur-sm transition-colors hover:text-gray-300"
    @click="store.setNavCollapsed(!store.navCollapsed)"
  >
    <UIcon name="i-heroicons-bars-3" class="size-5" />
  </button>

  <nav
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900 transition-transform duration-300"
    :class="shouldHideNav ? '-translate-x-full' : 'translate-x-0'"
  >
    <div
      class="relative flex h-16 items-stretch transition-[padding] duration-300"
      :class="showToggleButton ? 'pl-14' : ''"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150"
        :class="isActive(tab) ? 'text-white' : 'text-gray-500 hover:text-gray-400'"
      >
        <div
          class="flex items-center justify-center rounded-xl px-3 py-1 transition-colors duration-150"
          :class="isActive(tab) ? 'bg-gray-800' : ''"
        >
          <UIcon
            :name="isActive(tab) ? tab.activeIcon : tab.icon"
            class="size-5"
          />
        </div>
        <span class="text-[11px] font-medium tracking-wide">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
