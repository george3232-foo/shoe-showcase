/*
  BOTANICAL DRIFT — backlit petals & leaves drifting in a dark void.

  Nature, distilled: a dozen translucent petals tumble slowly through deep
  bokeh, glowing where light passes through them. A soft light pedestal lifts
  the shoe off the black. Move the cursor and the nearby petals catch a warm
  glint and drift aside in the breeze. Restraint is the point — lots of empty
  dark space so the white shoe stays the hero. No streaks, no particle spam.

  Interactive:  mouse  -> warm glint + breeze on nearby petals
  Scroll       -> season shifts spring-pink -> dusk-lilac, fall speeds up
*/
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll, Sparkles } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'

const PETALS = 16
const DEEP_BOKEH = 8
const FORE_BOKEH = 6
const KEEPOUT = 1.9 // empty vertical column for the shoe (world X)

// ---------- petal shader (translucent / backlit) ----------
const petalVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const petalFrag = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uBacklight;
  uniform float uSeason;   // 0..1 spring -> dusk
  uniform float uGlint;    // 0..1 cursor proximity
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    float v = clamp(vUv.y, 0.0, 1.0);
    float u = vUv.x * 2.0 - 1.0;             // -1..1 across width

    // real petal silhouette: pointed base + tip, widest mid
    float w = sin(3.14159265 * pow(v, 0.85)) * (1.0 - 0.15 * v);
    float edge = w - abs(u);
    if (edge <= 0.0) discard;
    float alpha = smoothstep(0.0, 0.045, edge);

    // base color, season shift, slightly brighter toward the tip
    vec3 base = mix(uColorA, uColorB, uSeason);
    base = mix(base, base + 0.12, smoothstep(0.2, 1.0, v));

    // procedural veins: central midrib + lateral branches
    float midrib = smoothstep(0.045, 0.0, abs(u)) * 0.22;
    float lat = sin((v * 9.0 - abs(u) * 7.0) * 3.14159265);
    float lateral = smoothstep(0.8, 1.0, lat) * (1.0 - abs(u)) * smoothstep(1.0, 0.1, v) * 0.10;
    float veins = midrib + lateral;

    // lighting: front + light transmitted through the petal
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(0.35, 0.6, 0.7));
    float front = clamp(dot(N, L), 0.0, 1.0);
    float back  = pow(clamp(dot(N, -L), 0.0, 1.0), 1.5);
    float rim   = 1.0 - smoothstep(0.0, 0.22, edge); // thin translucent edge glows

    vec3 col = base * (0.42 + 0.58 * front);
    col -= base * veins;
    col += uBacklight * back * 0.6;
    col += uBacklight * rim * 0.25;
    col += vec3(1.0, 0.85, 0.55) * uGlint * 0.45; // warm cursor glint
    gl_FragColor = vec4(col, alpha);
  }
`

// ---------- bokeh disc shader (creamy out-of-focus) ----------
const bokehVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const bokehFrag = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uSeason;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5);
    float a = smoothstep(0.5, 0.05, d) * uOpacity;
    vec3 c = mix(uColorA, uColorB, uSeason);
    gl_FragColor = vec4(c, a);
  }
`

const rand = (a, b) => a + Math.random() * (b - a)

export default function Background() {
  const scroll = useScroll()
  const { pointer, viewport } = useThree()

  // ---- shared geometry ----
  const petalGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1.6, 24, 32)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = -0.2 * (x * 2) * (x * 2) + 0.05 * Math.sin(y * 3.0) // curl + ripple
      pos.setZ(i, z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const discGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  // ---- petal state + per-petal material (own uGlint) ----
  const petals = useMemo(() => {
    const make = () => {
      let x
      do {
        x = rand(-7, 7)
      } while (Math.abs(x) < KEEPOUT)
      return {
        x,
        y: rand(-5, 5),
        z: rand(-5, -2.8),
        vy: rand(0.04, 0.09),
        swayAmp: rand(0.25, 0.7),
        swayFreq: rand(0.4, 0.9),
        swayPhase: rand(0, Math.PI * 2),
        rot: [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)],
        rotV: [rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.4, 0.4)],
        scale: rand(0.5, 1.0),
        glint: 0,
        offX: 0, // breeze offset (eased)
      }
    }
    return Array.from({ length: PETALS }, make)
  }, [])

  const petalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: petalVert,
        fragmentShader: petalFrag,
        transparent: true,
        depthWrite: true, // contribute depth so DoF blurs each petal by its true distance
        side: THREE.DoubleSide,
        uniforms: {
          uColorA: { value: new THREE.Color('#f5d6df') }, // spring cream-pink
          uColorB: { value: new THREE.Color('#caa9d6') }, // dusk lilac
          uBacklight: { value: new THREE.Color('#ffe9cf') },
          uSeason: { value: 0 },
          uGlint: { value: 0 },
        },
      }),
    []
  )
  const petalMats = useMemo(
    () => petals.map(() => petalMat.clone()),
    [petals, petalMat]
  )

  // ---- bokeh state (deep behind + foreground at edges) ----
  const bokeh = useMemo(() => {
    const deep = Array.from({ length: DEEP_BOKEH }, () => ({
      x: rand(-7, 7),
      y: rand(-5, 5),
      z: rand(-9, -6),
      vy: rand(0.01, 0.03),
      scale: rand(2.0, 3.5),
      base: 0.1,
    }))
    const fore = Array.from({ length: FORE_BOKEH }, () => {
      let x
      do {
        x = rand(-7, 7)
      } while (Math.abs(x) < 3) // edges only, leave center clear
      return {
        x,
        y: rand(-5, 5),
        z: rand(1.5, 2.5),
        vy: rand(0.05, 0.1),
        scale: rand(2.5, 4.0),
        base: 0.13,
        edge: true,
      }
    })
    return [...deep, ...fore]
  }, [])

  const bokehMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bokehVert,
        fragmentShader: bokehFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColorA: { value: new THREE.Color('#fbeede') },
          uColorB: { value: new THREE.Color('#e7a8bd') },
          uSeason: { value: 0 },
          uOpacity: { value: 0.1 },
        },
      }),
    []
  )
  const bokehMats = useMemo(() => bokeh.map(() => bokehMat.clone()), [bokeh, bokehMat])

  // pedestal + shaft materials
  const pedestalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bokehVert,
        fragmentShader: bokehFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColorA: { value: new THREE.Color('#3a3040') },
          uColorB: { value: new THREE.Color('#2a2230') },
          uSeason: { value: 0 },
          uOpacity: { value: 0.1 },
        },
      }),
    []
  )

  // ---- refs ----
  const petalRefs = useRef([])
  const bokehRefs = useRef([])

  // ---- scratch (no per-frame allocation) ----
  const cursor = useRef(new THREE.Vector3())
  const prevCursor = useRef(new THREE.Vector3())
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const off = scroll.offset // 0..1

    // season + dynamics from scroll
    const season = off
    const fallMul = 1 + off * 0.6
    const deepOp = 0.06 + off * 0.06
    const foreOp = 0.08 + off * 0.08
    // pedestal brightest mid-page (color/zoom sections)
    const ped = 0.07 + 0.1 * Math.exp(-Math.pow((off - 0.5) / 0.28, 2))

    // pointer -> world (plane near the petals), smoothed
    target.set(pointer.x * viewport.width * 0.5, pointer.y * viewport.height * 0.5, -4)
    easing.damp3(cursor.current, target, 0.18, dt)
    const curVelX = cursor.current.x - prevCursor.current.x
    prevCursor.current.copy(cursor.current)

    // responsive horizontal bounds: desktop unchanged (wide viewport), but on narrow
    // (portrait/mobile) screens pull petals on-screen with a smaller keep-out — the shoe
    // writes depth, so any petal passing behind it is occluded naturally.
    const narrow = state.viewport.width < 3.2
    const keep = narrow ? state.viewport.width * 0.12 : KEEPOUT
    const spreadX = narrow ? state.viewport.width * 0.7 : 7

    // petals
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i]
      const m = petalRefs.current[i]
      const mat = petalMats[i]
      if (!m) continue

      // reposition petals stranded off-screen (e.g. after a resize / portrait rotation)
      if (Math.abs(p.x) > spreadX + 0.01 || (keep > 0.001 && Math.abs(p.x) < keep)) {
        p.x = (keep + Math.random() * (spreadX - keep)) * (Math.random() < 0.5 ? -1 : 1)
        p.offX = 0
      }

      p.y -= p.vy * fallMul * dt
      p.rot[0] += p.rotV[0] * dt
      p.rot[1] += p.rotV[1] * dt
      p.rot[2] += p.rotV[2] * dt

      const sway = Math.sin(state.clock.elapsedTime * p.swayFreq + p.swayPhase) * p.swayAmp

      // breeze: push away from cursor (XY), eased
      const dx = p.x + p.offX - cursor.current.x
      const dy = p.y - cursor.current.y
      const dist = Math.hypot(dx, dy)
      let glintTarget = 0
      let offTarget = 0
      if (dist < 2.4) {
        const infl = 1 - dist / 2.4
        glintTarget = infl
        offTarget = Math.sign(dx || 1) * infl * 0.5 + curVelX * infl * 6
      }
      p.glint += (glintTarget - p.glint) * Math.min(1, dt * 4)
      p.offX += (offTarget - p.offX) * Math.min(1, dt * 3)

      m.position.set(p.x + sway + p.offX, p.y, p.z)
      m.rotation.set(p.rot[0], p.rot[1], p.rot[2])
      m.scale.setScalar(p.scale)

      mat.uniforms.uSeason.value = season
      mat.uniforms.uGlint.value = p.glint

      if (p.y < -5.2) {
        p.y = 5.2
        p.x = (keep + Math.random() * (spreadX - keep)) * (Math.random() < 0.5 ? -1 : 1)
        p.z = rand(-5, -2.8)
        p.offX = 0
      }
    }

    // bokeh
    for (let i = 0; i < bokeh.length; i++) {
      const b = bokeh[i]
      const m = bokehRefs.current[i]
      const mat = bokehMats[i]
      if (!m) continue
      b.y -= b.vy * fallMul * dt
      m.position.set(b.x, b.y, b.z)
      m.scale.setScalar(b.scale)
      mat.uniforms.uSeason.value = season
      mat.uniforms.uOpacity.value = b.edge ? foreOp : deepOp
      if (b.y < -6) {
        b.y = 6
        if (b.edge) {
          let nx
          do {
            nx = rand(-7, 7)
          } while (Math.abs(nx) < 3)
          b.x = nx
        } else {
          b.x = rand(-7, 7)
        }
      }
    }

    pedestalMat.uniforms.uOpacity.value = ped
  })

  return (
    <group>
      {/* soft morning light shaft behind everything */}
      <mesh position={[0.5, 0, -7]} scale={[7, 12, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={bokehVert}
          fragmentShader={bokehFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColorA: { value: new THREE.Color('#2b2640') },
            uColorB: { value: new THREE.Color('#15131f') },
            uSeason: { value: 0 },
            uOpacity: { value: 0.07 },
          }}
        />
      </mesh>

      {/* deep + foreground bokeh */}
      {bokeh.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => (bokehRefs.current[i] = el)}
          geometry={discGeo}
          material={bokehMats[i]}
          frustumCulled={false}
        />
      ))}

      {/* under-shoe light pedestal */}
      <mesh position={[0, -0.85, -0.6]} scale={[4.5, 2.6, 1]}>
        <planeGeometry args={[1, 1]} />
        <primitive object={pedestalMat} attach="material" />
      </mesh>

      {/* the petals — the one sharp, intentional layer */}
      {petals.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (petalRefs.current[i] = el)}
          geometry={petalGeo}
          material={petalMats[i]}
          frustumCulled={false}
        />
      ))}

      {/* whisper of ambient pollen */}
      <Sparkles
        count={40}
        scale={[12, 7, 4]}
        position={[0, 0, -3.5]}
        size={2}
        speed={0.2}
        opacity={0.22}
        color="#fbeede"
      />
    </group>
  )
}
