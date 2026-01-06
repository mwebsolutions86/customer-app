/* eslint-disable no-console */
export const isProd = (process.env.NODE_ENV === 'production')

export function log(...args: unknown[]) {
  if (!isProd) console.log(...args)
}

export function warn(...args: unknown[]) {
  if (!isProd) console.warn(...args)
}

export function error(...args: unknown[]) {
  console.error(...args)
}
