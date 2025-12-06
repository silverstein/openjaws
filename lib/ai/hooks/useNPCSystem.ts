"use client"

import { useCallback, useRef, useState } from "react"
import type { NPCType } from "../npcDialogue"

export interface NPC {
  id: string
  type: NPCType
  name: string
  position: { x: number; y: number }
  currentMessage?: string
  isActive: boolean
}

interface UseNPCSystemOptions {
  maxActiveNPCs?: number
  interactionRadius?: number
}

export function useNPCSystem({
  maxActiveNPCs = 5,
  interactionRadius = 100,
}: UseNPCSystemOptions = {}) {
  const [npcs, setNPCs] = useState<Map<string, NPC>>(new Map())
  const [activeConversations, setActiveConversations] = useState<Set<string>>(new Set())

  const conversationHistoryRef = useRef<Map<string, string[]>>(new Map())

  const createNPC = useCallback((type: NPCType, position: { x: number; y: number }): NPC => {
    const names: Record<NPCType, string[]> = {
      beach_vendor: ["Bob", "Sally", "Marco", "Lisa"],
      lifeguard: ["Jake", "Emma", "Mike", "Sarah"],
      tourist: ["Karen", "Todd", "Jennifer", "Brad"],
      surfer: ["Kai", "Luna", "Reef", "Wave"],
      scientist: ["Dr. Chen", "Dr. Smith", "Dr. Jones", "Dr. Park"],
      reporter: ["Chuck", "Diana", "Roger", "Angela"],
      old_timer: ["Old Pete", "Granny May", "Captain Ron", "Salty Sue"],
      fish_vendor: ["Captain Bill", "Fisherman Joe", "Marina", "Sailor Sam"],
    }

    const typeNames = names[type]
    const name = typeNames[Math.floor(Math.random() * typeNames.length)] ?? "NPC"
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const npc: NPC = {
      id,
      type,
      name,
      position,
      isActive: true,
    }

    return npc
  }, [])

  const removeNPC = useCallback((npcId: string) => {
    setNPCs((prev) => {
      const next = new Map(prev)
      next.delete(npcId)
      return next
    })

    setActiveConversations((prev) => {
      const next = new Set(prev)
      next.delete(npcId)
      return next
    })

    conversationHistoryRef.current.delete(npcId)
  }, [])

  const spawnNPC = useCallback(
    (type: NPCType, position: { x: number; y: number }) => {
      if (npcs.size >= maxActiveNPCs) {
        // Remove oldest inactive NPC
        const oldestInactive = Array.from(npcs.values())
          .filter((npc) => !activeConversations.has(npc.id))
          .sort((a, b) => a.id.localeCompare(b.id))[0]

        if (oldestInactive) {
          removeNPC(oldestInactive.id)
        }
      }

      const npc = createNPC(type, position)
      setNPCs((prev) => new Map(prev).set(npc.id, npc))

      return npc
    },
    [npcs, maxActiveNPCs, activeConversations, createNPC, removeNPC]
  )

  const updateNPCPosition = useCallback((npcId: string, position: { x: number; y: number }) => {
    setNPCs((prev) => {
      const npc = prev.get(npcId)
      if (!npc) {
        return prev
      }

      const next = new Map(prev)
      next.set(npcId, { ...npc, position })
      return next
    })
  }, [])

  const startConversation = useCallback((npcId: string) => {
    setActiveConversations((prev) => new Set(prev).add(npcId))
  }, [])

  const endConversation = useCallback((npcId: string) => {
    setActiveConversations((prev) => {
      const next = new Set(prev)
      next.delete(npcId)
      return next
    })
  }, [])

  const getNearbyNPCs = useCallback(
    (playerPosition: { x: number; y: number }): NPC[] => {
      return Array.from(npcs.values()).filter((npc) => {
        const distance = Math.sqrt(
          (npc.position.x - playerPosition.x) ** 2 + (npc.position.y - playerPosition.y) ** 2
        )
        return distance <= interactionRadius
      })
    },
    [npcs, interactionRadius]
  )

  const triggerEvent = useCallback(
    async (event: "shark_spotted" | "player_eaten" | "shark_defeated" | "storm_coming") => {
      // Get reactions from all active NPCs
      const reactions = await Promise.all(
        Array.from(npcs.values())
          .filter((npc) => npc.isActive)
          .map(async (npc) => {
            try {
              const response = await fetch(
                `/api/npc-chat?action=reaction&npcType=${npc.type}&event=${event}`
              )
              const { reaction } = await response.json()

              return { npcId: npc.id, reaction }
            } catch (error) {
              console.error(`Failed to get reaction from ${npc.name}:`, error)
              return null
            }
          })
      )

      // Update NPCs with their reactions
      reactions.forEach((result) => {
        if (result) {
          setNPCs((prev) => {
            const npc = prev.get(result.npcId)
            if (!npc) {
              return prev
            }

            const next = new Map(prev)
            next.set(result.npcId, { ...npc, currentMessage: result.reaction })
            return next
          })

          // Clear message after 5 seconds
          setTimeout(() => {
            setNPCs((prev) => {
              const npc = prev.get(result.npcId)
              if (!npc) {
                return prev
              }

              const next = new Map(prev)
              next.set(result.npcId, { ...npc, currentMessage: undefined })
              return next
            })
          }, 5000)
        }
      })
    },
    [npcs]
  )

  return {
    npcs: Array.from(npcs.values()),
    activeConversations,
    spawnNPC,
    removeNPC,
    updateNPCPosition,
    startConversation,
    endConversation,
    getNearbyNPCs,
    triggerEvent,
  }
}
