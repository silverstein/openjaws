/**
 * Convert SVG sprites to PNG using canvas
 * This uses sharp library for high-quality conversion
 */

import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import sharp from "sharp"

async function convertSVGToPNG(
  svgPath: string,
  pngPath: string
): Promise<void> {
  const svgBuffer = readFileSync(svgPath)

  await sharp(svgBuffer)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(pngPath)
}

async function convertAllSprites() {
  const baseDir = join(process.cwd(), "public", "assets", "sprites")
  const dirs = ["player", "shark", "npc", "beach"]

  let convertedCount = 0

  for (const dir of dirs) {
    const dirPath = join(baseDir, dir)
    const files = readdirSync(dirPath).filter((f) => f.endsWith(".svg"))

    for (const file of files) {
      const svgPath = join(dirPath, file)
      const pngPath = join(dirPath, file.replace(".svg", ".png"))

      try {
        await convertSVGToPNG(svgPath, pngPath)
        console.log(`✓ Converted: ${dir}/${file} -> PNG`)
        convertedCount++
      } catch (error) {
        console.error(`✗ Failed to convert ${dir}/${file}:`, error)
      }
    }
  }

  console.log(`\n✓ Converted ${convertedCount} sprites to PNG format`)
}

convertAllSprites().catch(console.error)
