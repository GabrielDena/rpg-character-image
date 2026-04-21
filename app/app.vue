<script setup lang="ts">
useHead({ htmlAttrs: { class: 'dark' } })
</script>

<template>
    <UApp>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>

