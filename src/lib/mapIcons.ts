import L from 'leaflet'

/** Icône "Ma position" : pin de localisation SVG (typique GPS / carte) */
const LOCATION_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
  <path fill="#2563eb" stroke="white" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"/>
  <circle cx="12" cy="11" r="4" fill="white"/>
</svg>`

export function createUserPositionIcon(): L.DivIcon {
  return L.divIcon({
    className: 'leaflet-user-position-marker',
    html: `<div style="line-height:0;display:flex;align-items:flex-end;justify-content:center;">${LOCATION_PIN_SVG}</div>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42]
  })
}

/** Marqueurs ronds (sites = vert, observations = ambre) */
export function createCircleIcon(color: string, sizePx: number): L.DivIcon {
  const half = sizePx / 2
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${sizePx}px; height: ${sizePx}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [sizePx, sizePx],
    iconAnchor: [half, half]
  })
}

export const SITE_MARKER_ICON = createCircleIcon('#10b981', 22)
export const OBS_MARKER_ICON = createCircleIcon('#f59e0b', 16)
