// Banned in packages/perron/src: tokens.ts is outside the package build's rootDir, by either path.
import { numeric } from '../../../tokens/generated/tokens.ts'
import { numeric as same } from '@mylder/perron/tokens.ts'

export default [numeric, same]
