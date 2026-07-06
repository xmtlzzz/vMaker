import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { cn } from '~/lib/utils'

type ShapeBlurProps = {
  borderSize?: number
  circleEdge?: number
  circleSize?: number
  className?: string
  pixelRatioProp?: number
  roundness?: number
  shapeSize?: number
  variation?: number
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uVariation;
  uniform float uShapeSize;
  uniform float uRoundness;
  uniform float uBorderSize;
  uniform float uCircleSize;
  uniform float uCircleEdge;
  uniform vec3 uAccent;
  uniform vec2 uResolution;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  float circle(vec2 p, float r) {
    return length(p) - r;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * aspect;

    float t = uTime * 0.75;
    float wave = sin(t + p.x * 5.0 + uVariation) * 0.035 + cos(t * 1.2 + p.y * 4.0) * 0.025;
    vec2 drift = vec2(sin(t * 0.8 + uVariation) * 0.08, cos(t * 0.65) * 0.06);

    float boxSize = 0.34 * uShapeSize;
    vec2 boxP = p - drift;
    boxP.x += wave;
    float boxShape = roundedBox(boxP, vec2(boxSize * 1.35, boxSize * 0.78), boxSize * uRoundness);

    vec2 circleP = p - vec2(0.22 + sin(t * 0.7) * 0.08, -0.04 + cos(t * 0.9) * 0.06);
    float circleShape = circle(circleP, max(0.02, uCircleSize));

    float fill = 1.0 - smoothstep(-uBorderSize, uBorderSize, min(boxShape, circleShape));
    float edge = 1.0 - smoothstep(0.0, max(0.001, uCircleEdge * 0.08), abs(circleShape));
    float glow = 1.0 - smoothstep(0.0, 0.42, min(abs(boxShape), abs(circleShape)));

    vec3 color = mix(uAccent * 0.65, vec3(1.0), edge * 0.18);
    float alpha = fill * 0.62 + glow * 0.28;

    gl_FragColor = vec4(color, alpha);
  }
`

function parseAccentRgb(element: HTMLElement) {
  const value = getComputedStyle(element).getPropertyValue('--vmaker-accent-rgb').trim()
  const [r = 245, g = 152, b = 242] = value.split(/\s+/).map(Number)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

export function ShapeBlur({
  borderSize = 0.05,
  circleEdge = 1,
  circleSize = 0.25,
  className,
  pixelRatioProp = 1,
  roundness = 0.5,
  shapeSize = 1,
  variation = 0,
}: ShapeBlurProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'shape-blur-canvas'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uAccent: { value: parseAccentRgb(container) },
      uBorderSize: { value: borderSize },
      uCircleEdge: { value: circleEdge },
      uCircleSize: { value: circleSize },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uRoundness: { value: roundness },
      uShapeSize: { value: shapeSize },
      uTime: { value: 0 },
      uVariation: { value: variation },
    }
    const material = new THREE.ShaderMaterial({
      depthWrite: false,
      fragmentShader,
      transparent: true,
      uniforms,
      vertexShader,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let frame = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)
      const pixelRatio = Math.min(pixelRatioProp || window.devicePixelRatio || 1, 2)

      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      uniforms.uResolution.value.set(width, height)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const render = (time: number) => {
      uniforms.uTime.value = time * 0.001
      uniforms.uAccent.value.copy(parseAccentRgb(container))
      renderer.render(scene, camera)
      frame = window.requestAnimationFrame(render)
    }

    frame = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [borderSize, circleEdge, circleSize, pixelRatioProp, roundness, shapeSize, variation])

  return <div aria-hidden='true' className={cn('shape-blur-shell', className)} ref={containerRef} />
}
