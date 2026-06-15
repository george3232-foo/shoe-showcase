/* HTML overlay sections, scrolled in sync with the 3D canvas via <Scroll html>. */

const SWATCHES = {
  laces:   ['#1a1a1a', '#ffffff', '#e02d2d', '#1565c0'],
  mesh:    ['#dddddd', '#111111', '#f5d547', '#2e7d32'],
  sole:    ['#ffffff', '#111111', '#e02d2d', '#ffb300'],
  stripes: ['#111111', '#e02d2d', '#1565c0', '#ffffff'],
}

function Section({ children, align = 'center', style }) {
  return (
    <section className="section" style={{ justifyContent: align, ...style }}>
      {children}
    </section>
  )
}

export default function Overlay({ colors, setColor }) {
  return (
    <div className="overlay">
      {/* 0 — HERO */}
      <Section align="flex-start">
        <p className="eyebrow">AIR SERIES — 2026</p>
        <h1 className="display">JUST<br />FLOW.</h1>
        <p className="lede">Engineered motion. Scroll to explore the build.</p>
      </Section>

      {/* 1 — ROTATE */}
      <Section align="flex-end">
        <div className="text-block right">
          <h2 className="headline">360°<br />OF CRAFT</h2>
          <p className="body">
            Every angle considered. A full rotation reveals the sculpted
            midsole and breathable knit upper.
          </p>
        </div>
      </Section>

      {/* 2 — COLOR / CONFIGURATOR */}
      <Section align="flex-start">
        <div className="text-block">
          <h2 className="headline">MAKE IT<br />YOURS</h2>
          <p className="body">Tap a part. Pick a color. See it live.</p>
          <div className="pickers">
            {Object.entries(SWATCHES).map(([part, hexes]) => (
              <div key={part} className="picker-row">
                <span className="picker-label">{part}</span>
                <div className="swatches">
                  {hexes.map((hex) => (
                    <button
                      key={hex}
                      className={'swatch' + (colors[part] === hex ? ' active' : '')}
                      style={{ background: hex }}
                      aria-label={`${part} ${hex}`}
                      onClick={() => setColor(part, hex)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 3 — FEATURE / ZOOM */}
      <Section align="center">
        <div className="text-block center">
          <h2 className="headline big">ZOOM AIR™</h2>
          <p className="body">
            Responsive cushioning underfoot. Energy return, step after step.
          </p>
          <ul className="specs">
            <li><strong>—</strong> Pressurized air units</li>
            <li><strong>—</strong> Carbon-plate stability</li>
            <li><strong>—</strong> 38% lighter foam</li>
          </ul>
        </div>
      </Section>

      {/* 4 — CTA / FOOTER */}
      <Section align="center">
        <div className="text-block center">
          <h2 className="display small">READY<br />TO MOVE?</h2>
          <button className="cta">PRE-ORDER · $189</button>
          <p className="note">Free shipping · 30-day returns</p>
        </div>
        <footer className="footer">
          <span>© 2026 AIR SERIES</span>
          <span>
            Model: floating-shoe by drcmda (MIT) · Built with react-three-fiber
          </span>
        </footer>
      </Section>
    </div>
  )
}
