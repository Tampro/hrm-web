export const formHelper = {
  /** Form defaults: value from the URL first, then the page default */
  getDefaultValues: <T extends Record<string, unknown>>(searchParams: URLSearchParams, defaults: T): T =>
    Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        typeof value === 'string' ? (searchParams.get(key) ?? value) : value
      ])
    ) as T
}
