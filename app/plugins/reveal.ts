export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | undefined

  function observe(el: HTMLElement) {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    observer.observe(el)
  }

  nuxtApp.vueApp.directive<HTMLElement>('reveal', {
    getSSRProps: () => ({}),
    mounted(el) {
      if (!import.meta.client) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (el.getBoundingClientRect().top < window.innerHeight) return
      el.classList.add('reveal')
      observe(el)
    },
    unmounted(el) {
      observer?.unobserve(el)
    },
  })
})
