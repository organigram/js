import type { Config } from 'jest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const localProtocolDeploymentsPath = resolve(
  '../protocol/deployments.local.json'
)

if (existsSync(localProtocolDeploymentsPath)) {
  process.env.NEXT_PUBLIC_LOCAL_PROTOCOL_DEPLOYMENTS = readFileSync(
    localProtocolDeploymentsPath,
    'utf8'
  )
}

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  watchman: false,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          target: 'ESNext',
          resolveJsonModule: true,
          esModuleInterop: true,
          types: ['jest', 'node']
        },
        diagnostics: false,
        useESM: true
      }
    ]
  }
}

export default config
