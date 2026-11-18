import { useState } from 'react'

/**
 * Keeps the last non-undefined value. Dialogs are opened with `value` and closed by setting it to undefined;
 * the close animation still renders the content, which otherwise flashes '-' placeholders.
 */
export const useLastDefined = <T>(value: T | undefined): T | undefined => {
  const [last, setLast] = useState(value)
  // Adjusting state while rendering (React docs: "storing information from previous renders")
  if (value !== undefined && value !== last) setLast(value)
  return value ?? last
}
