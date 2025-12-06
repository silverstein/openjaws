const isDev = process.env.NODE_ENV === 'development'

interface LoggerOptions {
  prefix?: string
}

function createLogger(options: LoggerOptions = {}) {
  const prefix = options.prefix ? `[${options.prefix}]` : ''

  return {
    debug: (...args: unknown[]) => {
      if (isDev) console.log(prefix, ...args)
    },
    info: (...args: unknown[]) => {
      if (isDev) console.info(prefix, ...args)
    },
    warn: (...args: unknown[]) => {
      console.warn(prefix, ...args)
    },
    error: (...args: unknown[]) => {
      console.error(prefix, ...args)
    },
  }
}

// Pre-configured loggers for different modules
export const logger = createLogger()
export const sharkLogger = createLogger({ prefix: 'SharkBrain' })
export const npcLogger = createLogger({ prefix: 'NPC' })
export const gameLogger = createLogger({ prefix: 'Game' })
export const audioLogger = createLogger({ prefix: 'Audio' })
export const apiLogger = createLogger({ prefix: 'API' })
export const commentaryLogger = createLogger({ prefix: 'Commentary' })

export { createLogger }
