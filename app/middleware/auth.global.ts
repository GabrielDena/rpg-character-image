export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const authenticated = !!sessionStorage.getItem('app_password')
  if (!authenticated && to.path !== '/') {
    return navigateTo('/')
  }
})
