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

const isNavHovered = ref(false)
const isDisplayPage = computed(() => route.path === '/display')
const shouldHideNav = computed(() => isDisplayPage.value && store.isFullscreen && !isNavHovered.value)

function handleFullscreenChange() {
  store.setFullscreen(!!document.fullscreenElement)
  if (!document.fullscreenElement) isNavHovered.value = false
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

function handleMouseMove(e: MouseEvent) {
  if (isDisplayPage.value && store.isFullscreen) {
    isNavHovered.value = e.clientY > window.innerHeight - 72
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900 transition-transform duration-300"
    :class="shouldHideNav ? 'translate-y-full' : 'translate-y-0'"
  >
    <div class="relative flex h-16 items-stretch">
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
