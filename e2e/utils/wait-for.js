// @ts-check
// Waiting helpers for real-backend specs.

/**
 * Response of a list GET for `pathname` whose query matches `query` exactly on the given keys.
 * Match the params, not just "the next list call": a write invalidates the list and its refetch (without the new
 * filter) can arrive first — that made CUR-INT-001 read 4 rows instead of 1 (2026-11-19).
 * @param {import('@playwright/test').Page} page
 * @param {string} pathname e.g. '/api/v1/saas/admin/currencies'
 * @param {Record<string, string>} query e.g. { keyword: 'QZZ' }
 */
export const waitForListResponse = (page, pathname, query) =>
  page.waitForResponse((r) => {
    if (r.request().method() !== 'GET') return false
    const url = new URL(r.url())
    return url.pathname === pathname && Object.entries(query).every(([k, v]) => url.searchParams.get(k) === v)
  })
