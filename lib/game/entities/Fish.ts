// Fish types available for purchase and use as bait

export type FishType = "sardine" | "mackerel" | "tuna" | "chum"

export interface Fish {
  type: FishType
  name: string
  price: number // Cost in points
  baitPower: number // Effectiveness as bait (1-4 scale)
  duration: number // How long the bait zone lasts (in ms)
  description: string
}

// Fish catalog with all available types
export const FISH_CATALOG: Record<FishType, Fish> = {
  sardine: {
    type: "sardine",
    name: "Sardine",
    price: 25,
    baitPower: 1,
    duration: 3000, // 3 seconds
    description: "Small but effective - a classic choice"
  },
  mackerel: {
    type: "mackerel",
    name: "Mackerel",
    price: 50,
    baitPower: 2,
    duration: 5000, // 5 seconds
    description: "Meatier and more tempting to predators"
  },
  tuna: {
    type: "tuna",
    name: "Tuna",
    price: 100,
    baitPower: 3,
    duration: 8000, // 8 seconds
    description: "Premium fish - irresistible to sharks"
  },
  chum: {
    type: "chum",
    name: "Chum Bucket",
    price: 200,
    baitPower: 4,
    duration: 12000, // 12 seconds
    description: "Maximum attraction - the ultimate distraction"
  }
}

// Helper function to get fish info by type
export function getFish(type: FishType): Fish {
  return FISH_CATALOG[type]
}

// Helper function to get all fish types
export function getAllFish(): Fish[] {
  return Object.values(FISH_CATALOG)
}
