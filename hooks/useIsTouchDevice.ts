import { useEffect, useState } from "react"

export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      // Check for touch capability
      const hasTouchScreen =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - Some browsers use msMaxTouchPoints
        navigator.msMaxTouchPoints > 0

      // Also check for small screen size (typical mobile/tablet)
      const hasSmallScreen = window.innerWidth < 1024

      // Consider it a touch device if it has both touch capability and small screen
      // OR if it has touch and no mouse (pure touch device)
      setIsTouchDevice(hasTouchScreen && (hasSmallScreen || !window.matchMedia("(pointer: fine)").matches))
    }

    checkTouchDevice()

    // Re-check on resize (e.g., device rotation)
    window.addEventListener("resize", checkTouchDevice)

    return () => {
      window.removeEventListener("resize", checkTouchDevice)
    }
  }, [])

  return isTouchDevice
}
