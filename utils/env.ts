const APP_ENVS = ['development', 'staging', 'production'] as const
export type AppEnv = (typeof APP_ENVS)[number]

function isAppEnv(value: unknown): value is AppEnv {
  return (
    typeof value === 'string' && (APP_ENVS as readonly string[]).includes(value)
  )
}

const raw = process.env.NEXT_PUBLIC_APP_ENV
const fallback: AppEnv =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
export const appEnv: AppEnv = isAppEnv(raw) ? raw : fallback

export const isDev = appEnv === 'development'
export const isStaging = appEnv === 'staging'
export const isProd = appEnv === 'production'
