import { useEffect, useState } from "react"

export function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      // Check if width > height (landscape)
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    checkOrientation()

    // Re-check on resize/orientation change
    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", checkOrientation)

    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [])

  return isLandscape
}
