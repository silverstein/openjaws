import { Assets } from "pixi.js"
import { gameLogger } from "@/lib/logger"

/**
 * Asset management using Pixi.js v8 Assets API
 * Handles preloading and caching of game sprites and textures
 */

export interface GameAssets {
  // Player sprites
  player: {
    influencer: string
    boomerDad: string
    surferBro: string
    lifeguard: string
    marineBiologist: string
    springBreaker: string
  }
  // Shark sprites
  shark: {
    body: string
    fin: string
  }
  // NPC sprites
  npc: {
    beach_vendor: string
    lifeguard: string
    tourist: string
    surfer: string
    scientist: string
    reporter: string
    old_timer: string
  }
  // Beach environment
  beach: {
    umbrella: string
    towel: string
    surfboard: string
  }
}

// Asset manifest with paths
const ASSET_MANIFEST: GameAssets = {
  player: {
    influencer: "/assets/sprites/player/influencer.png",
    boomerDad: "/assets/sprites/player/boomer-dad.png",
    surferBro: "/assets/sprites/player/surfer-bro.png",
    lifeguard: "/assets/sprites/player/lifeguard.png",
    marineBiologist: "/assets/sprites/player/marine-biologist.png",
    springBreaker: "/assets/sprites/player/spring-breaker.png",
  },
  shark: {
    body: "/assets/sprites/shark/shark-body.png",
    fin: "/assets/sprites/shark/shark-fin.png",
  },
  npc: {
    beach_vendor: "/assets/sprites/npc/beach-vendor.png",
    lifeguard: "/assets/sprites/npc/lifeguard.png",
    tourist: "/assets/sprites/npc/tourist.png",
    surfer: "/assets/sprites/npc/surfer.png",
    scientist: "/assets/sprites/npc/scientist.png",
    reporter: "/assets/sprites/npc/reporter.png",
    old_timer: "/assets/sprites/npc/old-timer.png",
  },
  beach: {
    umbrella: "/assets/sprites/beach/umbrella.png",
    towel: "/assets/sprites/beach/towel.png",
    surfboard: "/assets/sprites/beach/surfboard.png",
  },
}

export class AssetLoader {
  private static instance: AssetLoader | null = null
  private loaded = false
  private loadPromise: Promise<void> | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader()
    }
    return AssetLoader.instance
  }

  /**
   * Preload all game assets
   * Returns a promise that resolves when all assets are loaded
   */
  public async loadAssets(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Return immediately if already loaded
    if (this.loaded) {
      return Promise.resolve()
    }

    this.loadPromise = this.performLoad(onProgress)
    return this.loadPromise
  }

  private async performLoad(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // Flatten all asset paths
      const allAssets = this.getAllAssetPaths()

      // Add all assets to Pixi.js Assets
      const assetEntries = allAssets.map((path, index) => ({
        alias: `asset_${index}`,
        src: path,
      }))

      Assets.addBundle("game", assetEntries)

      // Load bundle with progress tracking
      await Assets.loadBundle("game", (progress) => {
        if (onProgress) {
          onProgress(progress)
        }
      })

      this.loaded = true
      gameLogger.debug("All game assets loaded successfully")
    } catch (error) {
      gameLogger.error("Error loading assets:", error)
      // Don't throw - game should work with fallback graphics
      this.loaded = false
    } finally {
      this.loadPromise = null
    }
  }

  /**
   * Get all asset paths from manifest
   */
  private getAllAssetPaths(): string[] {
    const paths: string[] = []

    // Player sprites
    for (const sprite of Object.values(ASSET_MANIFEST.player)) {
      paths.push(sprite)
    }

    // Shark sprites
    for (const sprite of Object.values(ASSET_MANIFEST.shark)) {
      paths.push(sprite)
    }

    // NPC sprites
    for (const sprite of Object.values(ASSET_MANIFEST.npc)) {
      paths.push(sprite)
    }

    // Beach sprites
    for (const sprite of Object.values(ASSET_MANIFEST.beach)) {
      paths.push(sprite)
    }

    return paths
  }

  /**
   * Get a loaded texture by path
   * Returns null if asset doesn't exist or failed to load
   */
  public getTexture(path: string) {
    try {
      return Assets.get(path)
    } catch {
      gameLogger.error(`Texture not found: ${path}`)
      return null
    }
  }

  /**
   * Check if assets are loaded
   */
  public isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Get asset manifest for reference
   */
  public getManifest(): GameAssets {
    return ASSET_MANIFEST
  }

  /**
   * Unload all assets (for cleanup)
   */
  public async unloadAssets(): Promise<void> {
    try {
      await Assets.unloadBundle("game")
      this.loaded = false
      gameLogger.debug("All game assets unloaded")
    } catch (error) {
      gameLogger.error("Error unloading assets:", error)
    }
  }
}

// Export singleton instance
export const assetLoader = AssetLoader.getInstance()
