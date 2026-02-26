'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// —— Full-page gradient + pointer-reactive halo (left side / full bg) ——
function initWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl')
  if (!gl) return

  const vertexSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `

  const fragmentSrc = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = st - u_pointer;
      float dist = length(p);
      float wave = 0.15 * sin(12.0 * dist - u_time * 1.5);
      float base = smoothstep(0.8, 0.0, dist + wave);
      vec3 blue = vec3(0.02, 0.14, 0.72);
      vec3 light = vec3(0.58, 0.75, 1.0);
      float radial = smoothstep(0.0, 0.6, base);
      vec3 color = mix(vec3(1.0), light, radial);
      color = mix(color, blue, st.y * 0.8);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  function compileShader(type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('WebGL shader error', gl.getShaderInfoLog(shader) ?? '')
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vs = compileShader(gl.VERTEX_SHADER, vertexSrc)
  const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSrc)
  if (!vs || !fs) return

  const program = gl.createProgram()
  if (!program) return
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('WebGL program error', gl.getProgramInfoLog(program) ?? '')
    gl.deleteProgram(program)
    return
  }

  gl.useProgram(program)

  const positionLoc = gl.getAttribLocation(program, 'a_position')
  const timeLoc = gl.getUniformLocation(program, 'u_time')
  const resLoc = gl.getUniformLocation(program, 'u_resolution')
  const pointerLoc = gl.getUniformLocation(program, 'u_pointer')

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

  let start = performance.now()
  let pointer = { x: 0.5, y: 0.5 }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
    pointer = { x: (clientX - rect.left) / rect.width, y: 1 - (clientY - rect.top) / rect.height }
  }

  canvas.addEventListener('mousemove', handleMove)
  canvas.addEventListener('touchmove', handleMove, { passive: true })

  function resize() {
    const dpr = window.devicePixelRatio || 1
    const w = Math.floor(canvas.clientWidth * dpr)
    const h = Math.floor(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
    if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height)
  }

  resize()
  window.addEventListener('resize', resize)

  function render() {
    const t = (performance.now() - start) / 1000
    if (timeLoc) gl.uniform1f(timeLoc, t)
    if (pointerLoc) gl.uniform2f(pointerLoc, pointer.x, pointer.y)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

  return () => {
    window.removeEventListener('resize', resize)
    canvas.removeEventListener('mousemove', handleMove)
    canvas.removeEventListener('touchmove', handleMove)
  }
}

// —— Right panel: floating orbs + soft gradient (additional WebGL) ——
function initOrbsWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl')
  if (!gl) return

  const vertexSrc = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `

  const fragmentSrc = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec2 uv = st * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;

      vec3 bg = mix(
        vec3(0.92, 0.95, 0.98),
        vec3(0.85, 0.91, 0.97),
        st.y
      );

      float orb = 0.0;
      float t = u_time * 0.15;
      vec2 o1 = vec2(-0.3 + 0.12 * sin(t), 0.2 + 0.1 * cos(t * 1.1));
      vec2 o2 = vec2(0.4 + 0.08 * cos(t * 0.9), -0.15 + 0.12 * sin(t * 1.2));
      vec2 o3 = vec2(0.1 + 0.15 * sin(t * 0.8), 0.35 + 0.08 * cos(t));
      vec2 o4 = vec2(-0.25 + 0.1 * cos(t * 1.3), -0.25 + 0.1 * sin(t * 0.9));

      float r1 = length(uv - o1);
      float r2 = length(uv - o2);
      float r3 = length(uv - o3);
      float r4 = length(uv - o4);

      vec3 c1 = vec3(0.45, 0.65, 0.95);
      vec3 c2 = vec3(0.55, 0.78, 1.0);
      vec3 c3 = vec3(0.7, 0.85, 1.0);
      vec3 c4 = vec3(0.4, 0.6, 0.9);

      orb += 0.5 * (1.0 - smoothstep(0.0, 0.7, r1));
      orb += 0.35 * (1.0 - smoothstep(0.0, 0.5, r2));
      orb += 0.4 * (1.0 - smoothstep(0.0, 0.6, r3));
      orb += 0.3 * (1.0 - smoothstep(0.0, 0.55, r4));

      vec3 col = mix(bg, c1, 0.2 * (1.0 - smoothstep(0.0, 0.7, r1)));
      col = mix(col, c2, 0.18 * (1.0 - smoothstep(0.0, 0.5, r2)));
      col = mix(col, c3, 0.2 * (1.0 - smoothstep(0.0, 0.6, r3)));
      col = mix(col, c4, 0.15 * (1.0 - smoothstep(0.0, 0.55, r4)));

      gl_FragColor = vec4(col, 1.0);
    }
  `

  function compileShader(type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('WebGL orbs shader error', gl.getShaderInfoLog(shader) ?? '')
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vs = compileShader(gl.VERTEX_SHADER, vertexSrc)
  const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSrc)
  if (!vs || !fs) return

  const program = gl.createProgram()
  if (!program) return
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('WebGL orbs program error', gl.getProgramInfoLog(program) ?? '')
    gl.deleteProgram(program)
    return
  }

  gl.useProgram(program)

  const positionLoc = gl.getAttribLocation(program, 'a_position')
  const timeLoc = gl.getUniformLocation(program, 'u_time')
  const resLoc = gl.getUniformLocation(program, 'u_resolution')

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

  let start = performance.now()

  function resize() {
    const dpr = window.devicePixelRatio || 1
    const w = Math.floor(canvas.clientWidth * dpr)
    const h = Math.floor(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
    if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height)
  }

  resize()
  window.addEventListener('resize', resize)

  function render() {
    const t = (performance.now() - start) / 1000
    if (timeLoc) gl.uniform1f(timeLoc, t)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

  return () => window.removeEventListener('resize', resize)
}

function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    let cleanup: (() => void) | void
    const run = () => {
      if (disposed || !canvas.parentElement) return
      const { clientWidth, clientHeight } = canvas.parentElement
      if (clientWidth > 0 && clientHeight > 0) {
        cleanup = initWebGL(canvas)
        return
      }
      requestAnimationFrame(run)
    }
    const id = requestAnimationFrame(run)
    return () => {
      disposed = true
      cancelAnimationFrame(id)
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" style={{ minHeight: 1, minWidth: 1 }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" />
    </div>
  )
}

function RightPanelWebGL() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    let cleanup: (() => void) | void
    const run = () => {
      if (disposed || !canvas.parentElement) return
      const { clientWidth, clientHeight } = canvas.parentElement
      if (clientWidth > 0 && clientHeight > 0) {
        cleanup = initOrbsWebGL(canvas)
        return
      }
      requestAnimationFrame(run)
    }
    const id = requestAnimationFrame(run)
    return () => {
      disposed = true
      cancelAnimationFrame(id)
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" style={{ minHeight: 1, minWidth: 1 }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#eef4fb]/80 to-transparent" />
    </div>
  )
}

const TESTIMONIALS = [
  {
    quote: 'We moved from spreadsheets to Hinza. End-to-end visibility and audit trails made compliance straightforward.',
    author: '— Sarah M.',
  },
  {
    quote: 'Role-based workflows mean QA and operations stay aligned. Complaints get closed faster with clear ownership.',
    author: '— James L.',
  },
]

export default function LandingHero() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#020617]">
      <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
        {/* Left column: CTA (Monarch-style) — bg ensures content visible if WebGL fails */}
        <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center bg-white px-6 py-14 sm:px-10 sm:py-16 lg:min-h-0 lg:w-[42%] lg:max-w-[520px] lg:px-12 lg:py-20">
          <HeroBackground />
          <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">H</span>
              <span className="text-xl font-semibold tracking-tight text-[#0f172a]">Hinza</span>
            </div>

            <h1 className="mt-10 text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
              Sign in to manage complaints
            </h1>
            <p className="mt-3 text-base text-[#64748b]">
              Enterprise complaint management by Mask&apos;d Digital. One workflow, full audit trail.
            </p>

            <div className="mt-8 w-full space-y-4">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
              >
                Log in
              </Link>
              <p className="text-center text-sm text-[#64748b]">
                Need access? Contact your company admin.
              </p>
            </div>

            <p className="mt-10 text-sm text-[#94a3b8]">
              By signing in you agree to our{' '}
              <Link href="/login" className="font-medium text-[#1d4ed8] hover:underline">Terms</Link>
              {' '}and{' '}
              <Link href="/login" className="font-medium text-[#1d4ed8] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* Right column: testimonial + product preview + WebGL */}
        <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center bg-[#eef4fb] px-6 py-14 sm:px-10 sm:py-16 lg:min-h-0 lg:w-[58%] lg:px-12 lg:py-20">
          <RightPanelWebGL />
          <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
            {/* Carousel dots */}
            <div className="flex gap-2" role="tablist" aria-label="Testimonials">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={activeTestimonial === i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2 w-2 rounded-full transition ${activeTestimonial === i ? 'bg-[#1d4ed8] scale-110' : 'bg-[#94a3b8] hover:bg-[#64748b]'}`}
                />
              ))}
            </div>

            {/* Stars */}
            <div className="mt-6 flex gap-0.5" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="text-amber-400">★</span>
              ))}
            </div>

            {/* Testimonial */}
            <blockquote className="mt-4 text-center text-lg font-medium leading-relaxed text-[#0f172a] sm:text-xl">
              &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
            </blockquote>
            <p className="mt-3 text-sm text-[#64748b]">{TESTIMONIALS[activeTestimonial].author}</p>

            {/* Product preview mockup */}
            <div className="mt-10 w-full overflow-hidden rounded-2xl border border-blue-100 bg-white/90 shadow-xl backdrop-blur">
              <div className="flex">
                <div className="w-12 shrink-0 bg-[#1e3a5f] py-4 pl-3">
                  <div className="space-y-3">
                    {['Dashboard', 'Complaints', 'Reports'].map((label, i) => (
                      <div key={label} className="h-2 w-6 rounded bg-white/20" title={label} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="h-3 w-24 rounded bg-[#e2e8f0]" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50" />
                    ))}
                  </div>
                  <div className="mt-4 h-20 rounded-xl bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Monarch-style dark bar) */}
      <footer className="flex shrink-0 items-center justify-between bg-[#1e293b] px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[#1d4ed8] text-sm font-bold text-white">H</span>
          <span className="text-sm font-medium text-white">Hinza</span>
        </div>
        <p className="text-sm text-slate-400">
          Built by <span className="font-medium text-white">Mask&apos;d Digital</span>
        </p>
      </footer>
    </main>
  )
}
