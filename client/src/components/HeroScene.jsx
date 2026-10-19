import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 550 }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.03
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#5b5bd6"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function WireShape({ position, args, color, speed = 1, radius = 1 }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.14 * speed
    ref.current.rotation.y += delta * 0.18 * speed
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 * speed + radius) * 0.35
  })

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={args} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
    </mesh>
  )
}

function FlowingTorus() {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * 0.1
    ref.current.rotation.x = Math.PI / 2.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.15
  })
  return (
    <mesh ref={ref} position={[5.6, -1.9, -3]}>
      <torusGeometry args={[1.7, 0.42, 16, 60]} />
      <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.16} />
    </mesh>
  )
}

function Rig() {
  const { camera, pointer } = useThree()
  useFrame((state, delta) => {
    const speed = Math.min(delta * 2.4, 1)
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * speed
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * speed
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function HeroScene({ className = '' }) {
  const wrapRef = useRef(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((e) => setVisible(e[0].isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.5], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Rig />
        <Particles />
        <WireShape position={[-5.4, 1.4, -3]} args={[1.05, 0]} color="#5b5bd6" speed={0.9} />
        <WireShape position={[5.6, 2.1, -4]} args={[0.75, 1]} color="#8b5cf6" speed={1.25} />
        <WireShape position={[-4.4, -2.1, -2]} args={[0.55, 1]} color="#2563eb" speed={1.1} />
        <FlowingTorus />
      </Canvas>
    </div>
  )
}
