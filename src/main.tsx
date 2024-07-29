import './index.css'
import React from 'react'

import App from './App.tsx'
import * as THREE from 'three'
import { extend, createRoot, events } from '@react-three/fiber'

extend(THREE)

const canvas = document.querySelector('canvas')
const root = createRoot(canvas!)

const resolution = {
  width: 1920 * window.devicePixelRatio,
  height: 1080 * window.devicePixelRatio,
}

root.configure({
  shadows: true,
  frameloop: 'demand',
  dpr: window.devicePixelRatio,
  events,
  orthographic: true,
  camera: {
    zoom: 4,
    near: -1000,
    far: 1000,
  },
  size: {
    top: 0,
    left: 0,
    width: resolution.width,
    height: resolution.height,
  },
})

// Render entry point
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const resize = () => {
  if (canvas) {
    const parent = canvas.parentElement

    if (parent) {
      const parentAspectRatio = parent.clientWidth / parent.clientHeight
      const aspectRatio = resolution.width / resolution.height

      let width = parent.clientWidth
      let height = parent.clientHeight

      if (parentAspectRatio > aspectRatio) {
        width = parent.clientHeight * aspectRatio
      } else {
        height = parent.clientWidth / aspectRatio
      }

      canvas.width = resolution.width * window.devicePixelRatio
      canvas.height = resolution.height * window.devicePixelRatio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
  }
}

window.addEventListener('resize', resize)
resize()
