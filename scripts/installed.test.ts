import { describe, expect, it } from 'vitest'
import { staleInstall } from './installed.ts'

const lock = {
  packages: {
    '': { version: '0.0.0' },
    'node_modules/next': { version: '15.5.0' },
    'node_modules/react': { version: '19.2.0' },
    'node_modules/@esbuild/linux-x64': { version: '0.25.0', optional: true },
    'node_modules/fsevents': { version: '2.3.3', devOptional: true },
  },
}

describe('installed', () => {
  it('passes node_modules that holds every package the lockfile needs, at its version', () => {
    const installed = {
      packages: {
        'node_modules/next': { version: '15.5.0' },
        'node_modules/react': { version: '19.2.0' },
      },
    }
    expect(staleInstall(lock, installed)).toEqual([])
  })

  it('names a package missing or at another version, as after a merge that changed the lockfile', () => {
    const installed = { packages: { 'node_modules/react': { version: '19.1.0' } } }
    expect(staleInstall(lock, installed)).toEqual(['node_modules/next', 'node_modules/react'])
  })

  it('names every needed package when npm has recorded no install', () => {
    expect(staleInstall(lock, undefined)).toEqual(['node_modules/next', 'node_modules/react'])
  })
})
