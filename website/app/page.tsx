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

export default async function HomePage() {
  const figures = await readHomeFigures()
  return (
    <div className="page home">
      <Hero figures={figures} />
      <LiveColumns figures={figures} />
      <MadeOf figures={figures} />
      <PhoneSections figures={figures} />
      <Resources figures={figures} />
    </div>
  )
}
