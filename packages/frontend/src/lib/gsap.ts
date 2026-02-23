import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register plugins once at module level
gsap.registerPlugin(ScrollTrigger, useGSAP)

// Global defaults matching design system timing
gsap.defaults({
  ease: 'power2.out',
  duration: 0.2,
})

// Respect prefers-reduced-motion at the GSAP level
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
if (mq.matches) {
  gsap.globalTimeline.timeScale(1000)
}
mq.addEventListener('change', (e) => {
  gsap.globalTimeline.timeScale(e.matches ? 1000 : 1)
})

export { gsap, ScrollTrigger }
export default gsap
