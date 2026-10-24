// perron-allow(patterns): the map canvas has no Perron component
import maplibre from 'maplibre-gl'

export const Fixture = () => <div ref={(el) => el && new maplibre.Map({ container: el })} />
