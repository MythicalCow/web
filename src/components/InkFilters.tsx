/* Shared SVG filters: #ink-press (imperfect printed ink) and #paper-grain (newsprint). */
/* ------------------------------------------------------------------ */
/* SVG filters                                                         */
/* ------------------------------------------------------------------ */
export default function InkFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {/* Ink on cheap paper: wobbly edges, bleed/spread, dropouts, uneven density */}
        <filter id="ink-press" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          {/* 1. fibre-scale wobble of every edge */}
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" result="fibre" />
          <feDisplacementMap in="SourceGraphic" in2="fibre" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="wobbled" />
          {/* 2. ink bleed: blur then re-sharpen alpha so strokes fatten + round off */}
          <feGaussianBlur in="wobbled" stdDeviation="0.55" result="soft" />
          <feComponentTransfer in="soft" result="bled">
            <feFuncA type="linear" slope="3.2" intercept="-0.3" />
          </feComponentTransfer>
          {/* 3. dropouts – tiny specks where ink didn't take */}
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="speckNoise" />
          <feColorMatrix in="speckNoise" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -16 0 0 0 12.6" result="speckMask" />
          <feComposite in="bled" in2="speckMask" operator="in" result="specked" />
          {/* 4. uneven roller pressure – large soft blotches of lighter ink */}
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="5" result="press" />
          <feColorMatrix in="press" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 0.25" result="pressMask" />
          <feComposite in="specked" in2="pressMask" operator="in" />
        </filter>

        {/* Gentle press for body text: same wobble, bleed and specks, only a whisper of uneven pressure */}
        <filter id="ink-text" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" result="fibre" />
          <feDisplacementMap in="SourceGraphic" in2="fibre" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="wobbled" />
          <feGaussianBlur in="wobbled" stdDeviation="0.5" result="soft" />
          <feComponentTransfer in="soft" result="bled">
            <feFuncA type="linear" slope="3.2" intercept="-0.3" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="speckNoise" />
          <feColorMatrix in="speckNoise" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -16 0 0 0 12.8" result="speckMask" />
          <feComposite in="bled" in2="speckMask" operator="in" result="specked" />
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="5" result="press" />
          <feColorMatrix in="press" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.3 0 0 0 0.88" result="pressMask" />
          <feComposite in="specked" in2="pressMask" operator="in" />
        </filter>

        {/* Same press, tuned for big solid areas: no airbrushed blotches, just fine mottle */}
        <filter id="ink-press-solid" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="3" result="fibre" />
          <feDisplacementMap in="SourceGraphic" in2="fibre" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="wobbled" />
          <feGaussianBlur in="wobbled" stdDeviation="0.6" result="soft" />
          <feComponentTransfer in="soft" result="bled">
            <feFuncA type="linear" slope="3.2" intercept="-0.3" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="speckNoise" />
          <feColorMatrix in="speckNoise" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -16 0 0 0 12.4" result="speckMask" />
          <feComposite in="bled" in2="speckMask" operator="in" result="specked" />
          {/* fine mottle: ink sitting unevenly in the paper fibres */}
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="8" result="mottle" />
          <feColorMatrix in="mottle" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0 0 0 0.68" result="mottleMask" />
          <feComposite in="specked" in2="mottleMask" operator="in" />
        </filter>

        {/* Newsprint: grain + fibres + a few darker flecks */}
        <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2" result="grain" />
          <feColorMatrix in="grain" type="matrix"
            values="0 0 0 0 0.35  0 0 0 0 0.30  0 0 0 0 0.22  1.8 0 0 0 -0.75" result="grainTint" />
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="2" seed="9" result="fibres" />
          <feColorMatrix in="fibres" type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  0 3 0 0 -1.95" result="fibreTint" />
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="1" seed="21" result="fleckNoise" />
          <feColorMatrix in="fleckNoise" type="matrix"
            values="0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0 0.1  0 30 0 0 -22.5" result="flecks" />
          <feMerge>
            <feMergeNode in="grainTint" />
            <feMergeNode in="fibreTint" />
            <feMergeNode in="flecks" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

