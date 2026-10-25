// The docs search's index as one static file, written at build time, so no page carries it: the
// search dialog fetches it when it first opens (SiteSearchDialog).
import { readSearchIndex } from '../../lib/search-index.ts'

export const dynamic = 'force-static'

export async function GET() {
  return Response.json(await readSearchIndex())
}
