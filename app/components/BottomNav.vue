<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Folder', icon: 'i-heroicons-folder', activeIcon: 'i-heroicons-folder-open', to: '/' },
  { label: 'Select', icon: 'i-heroicons-photo', activeIcon: 'i-heroicons-photo', to: '/select' },
  { label: 'Gallery', icon: 'i-heroicons-squares-2x2', activeIcon: 'i-heroicons-squares-2x2', to: '/gallery' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900">
    <div class="relative flex h-16 items-stretch">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150"
        :class="isActive(tab.to) ? 'text-white' : 'text-gray-500 hover:text-gray-400'"
      >
        <div
          class="flex items-center justify-center rounded-xl px-3 py-1 transition-colors duration-150"
          :class="isActive(tab.to) ? 'bg-gray-800' : ''"
        >
          <UIcon
            :name="isActive(tab.to) ? tab.activeIcon : tab.icon"
            class="size-5"
          />
        </div>
        <span class="text-[11px] font-medium tracking-wide">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
