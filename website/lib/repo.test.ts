import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  findRepoRoot,
  githubUrl,
  once,
  PACKAGES,
  readPackage,
  readRepoFile,
  REPO_URL,
  repoRoot,
} from './repo.ts'

describe('repoRoot', () => {
  it('finds the folder that holds the registry, from the root or from website/', () => {
    expect(existsSync(join(repoRoot(), 'packages/perron/components.json'))).toBe(true)
    expect(findRepoRoot(join(repoRoot(), 'website'))).toBe(repoRoot())
  })

  it('throws outside a Perron repository', () => {
    expect(() => findRepoRoot('/')).toThrow(/No Perron repository/)
  })
})

describe('readRepoFile', () => {
  it('reads a file by its path from the root', () => {
    expect(readRepoFile('docs/content-design.md')).toMatch(/^# Content design/)
  })
})

describe('githubUrl', () => {
  it('links a file as a blob and a folder as a tree', () => {
    expect(githubUrl('docs/glossary.md')).toBe(`${REPO_URL}/blob/main/docs/glossary.md`)
    expect(githubUrl('packages/perron/icons')).toBe(`${REPO_URL}/tree/main/packages/perron/icons`)
    expect(githubUrl('')).toBe(REPO_URL)
  })
})

describe('readPackage', () => {
  it('gives the shipped packages their names and versions', () => {
    expect(readPackage(PACKAGES.perron).name).toBe('@mylder/perron')
    expect(readPackage(PACKAGES.mcp).name).toBe('@mylder/perron-mcp')
    expect(readPackage(PACKAGES.perron).version).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('once', () => {
  it('reads afresh outside a production build', () => {
    let calls = 0
    const load = once(() => ++calls)
    load()
    load()
    expect(calls).toBe(2)
  })
})
