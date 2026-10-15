export function useUnsavedGuard(isDirty: Ref<boolean> | ComputedRef<boolean>) {
  const message = 'You have unsaved changes. Leave this page?'

  onBeforeRouteLeave(() => {
    if (isDirty.value && !window.confirm(message)) return false
  })

  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (!isDirty.value) return
    event.preventDefault()
  })
}
