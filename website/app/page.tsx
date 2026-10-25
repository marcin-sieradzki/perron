// Home, from Home.dc.html over the layout's full map: the hero, the still columns of live
// components in glass, what the system is made of, and where Perron lives. Under breakpoint.phone
// it follows Phone-Home.dc.html: an opaque sheet with the sections and one panel in place of the
// columns and tiles. Every figure comes from readHomeFigures.
import '@/components/home/home.css'
import { readHomeFigures } from '@/components/home/figures.ts'
import { Hero } from '@/components/home/Hero.tsx'
import { LiveColumns } from '@/components/home/LiveColumns.tsx'
import { MadeOf } from '@/components/home/MadeOf.tsx'
import { PhoneSections } from '@/components/home/PhoneSections.tsx'
import { Resources } from '@/components/home/Resources.tsx'
import { BASE_PATH } from '@/lib/base-path.ts'

// Storybook was the site's root before the website, so its old links, `?path=/docs/…`, land here:
// send them on to Storybook, which now sits under storybook/.
const STORYBOOK_REDIRECT = `if (new URLSearchParams(location.search).has('path')) location.replace('${BASE_PATH}/storybook/' + location.search + location.hash)`

export default async function HomePage() {
  const figures = await readHomeFigures()
  return (
    <div className="page home">
      <script dangerouslySetInnerHTML={{ __html: STORYBOOK_REDIRECT }} />
      <Hero figures={figures} />
      <LiveColumns figures={figures} />
      <MadeOf figures={figures} />
      <PhoneSections figures={figures} />
      <Resources figures={figures} />
    </div>
  )
}
