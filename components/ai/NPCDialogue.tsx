"use client"

import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, Send, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { NPCContext, NPCType } from "@/lib/ai/npcDialogue"
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice"

interface ChatMessage {
  id: string
  role: "player" | "npc"
  content: string
  timestamp: number
}

interface NPCDialogueProps {
  npcType: NPCType
  npcName: string
  position: { x: number; y: number }
  isPlayerNearby: boolean
  playerName: string
  currentEvent?: NPCContext["currentEvent"]
  timeOfDay?: NPCContext["timeOfDay"]
  recentSharkSighting?: boolean
  onClose?: () => void
}

export function NPCDialogue({
  npcType,
  npcName,
  position,
  isPlayerNearby,
  playerName,
  currentEvent,
  timeOfDay = "day",
  recentSharkSighting = false,
  onClose,
}: NPCDialogueProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState("")
  const [hasGreeted, setHasGreeted] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isTouchDevice = useIsTouchDevice()

  // Get NPC-specific styling
  const getNPCStyle = useCallback(() => {
    const styles: Record<
      NPCType,
      { bg: string; border: string; text: string; accent: string; bubble: string }
    > = {
      beach_vendor: {
        bg: "bg-yellow-50",
        border: "border-yellow-500",
        text: "text-yellow-900",
        accent: "bg-yellow-500",
        bubble: "bg-yellow-100",
      },
      lifeguard: {
        bg: "bg-red-50",
        border: "border-red-500",
        text: "text-red-900",
        accent: "bg-red-500",
        bubble: "bg-red-100",
      },
      tourist: {
        bg: "bg-pink-50",
        border: "border-pink-500",
        text: "text-pink-900",
        accent: "bg-pink-500",
        bubble: "bg-pink-100",
      },
      surfer: {
        bg: "bg-blue-50",
        border: "border-blue-500",
        text: "text-blue-900",
        accent: "bg-blue-500",
        bubble: "bg-blue-100",
      },
      scientist: {
        bg: "bg-emerald-50",
        border: "border-emerald-500",
        text: "text-emerald-900",
        accent: "bg-emerald-500",
        bubble: "bg-emerald-100",
      },
      reporter: {
        bg: "bg-purple-50",
        border: "border-purple-500",
        text: "text-purple-900",
        accent: "bg-purple-500",
        bubble: "bg-purple-100",
      },
      old_timer: {
        bg: "bg-stone-50",
        border: "border-stone-500",
        text: "text-stone-900",
        accent: "bg-stone-500",
        bubble: "bg-stone-100",
      },
      fish_vendor: {
        bg: "bg-cyan-50",
        border: "border-cyan-600",
        text: "text-cyan-900",
        accent: "bg-cyan-600",
        bubble: "bg-cyan-100",
      },
    }
    return styles[npcType] || styles.tourist
  }, [npcType])

  const style = getNPCStyle()

  // Build NPC context for API calls
  const buildContext = useCallback((): NPCContext => {
    return {
      npcType,
      npcName,
      playerName,
      currentEvent,
      timeOfDay,
      recentSharkSighting,
      previousMessages: chatHistory.map((m) => `${m.role === "player" ? playerName : npcName}: ${m.content}`),
    }
  }, [npcType, npcName, playerName, currentEvent, timeOfDay, recentSharkSighting, chatHistory])

  // Fetch greeting when player approaches
  useEffect(() => {
    if (isPlayerNearby && !hasGreeted) {
      const fetchGreeting = async () => {
        try {
          const context = buildContext()
          const response = await fetch(
            `/api/npc-chat?action=greeting&context=${encodeURIComponent(JSON.stringify(context))}`
          )
          const data = await response.json()

          if (data.greeting) {
            setChatHistory([
              {
                id: `greeting_${Date.now()}`,
                role: "npc",
                content: data.greeting,
                timestamp: Date.now(),
              },
            ])
            setHasGreeted(true)
          }
        } catch (error) {
          console.error("Failed to get NPC greeting:", error)
        }
      }

      fetchGreeting()
    } else if (!isPlayerNearby) {
      // Reset when player leaves
      setHasGreeted(false)
      setChatHistory([])
      setIsExpanded(false)
    }
  }, [isPlayerNearby, hasGreeted, buildContext])

  // Handle event reactions
  useEffect(() => {
    if (currentEvent && ["shark_nearby", "player_hurt", "storm", "shark_attack"].includes(currentEvent)) {
      const eventMap: Record<string, string> = {
        shark_nearby: "shark_spotted",
        player_hurt: "player_eaten",
        storm: "storm_coming",
        shark_attack: "shark_spotted",
      }

      const fetchReaction = async () => {
        try {
          const response = await fetch(
            `/api/npc-chat?action=reaction&npcType=${npcType}&event=${eventMap[currentEvent] || currentEvent}`
          )
          const data = await response.json()

          if (data.reaction) {
            setChatHistory((prev) => [
              ...prev,
              {
                id: `reaction_${Date.now()}`,
                role: "npc",
                content: data.reaction,
                timestamp: Date.now(),
              },
            ])
          }
        } catch (error) {
          console.error("Failed to get NPC reaction:", error)
        }
      }

      fetchReaction()
    }
  }, [currentEvent, npcType])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory, currentStreamedMessage])

  // Handle sending a message
  const handleSendMessage = async () => {
    const message = inputValue.trim()
    if (!message || isTyping) return

    // Add player message to chat
    const playerMessage: ChatMessage = {
      id: `player_${Date.now()}`,
      role: "player",
      content: message,
      timestamp: Date.now(),
    }
    setChatHistory((prev) => [...prev, playerMessage])
    setInputValue("")
    setIsTyping(true)
    setCurrentStreamedMessage("")

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/npc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: buildContext(),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setCurrentStreamedMessage(fullResponse)
      }

      // Add completed NPC message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          id: `npc_${Date.now()}`,
          role: "npc",
          content: fullResponse,
          timestamp: Date.now(),
        },
      ])
      setCurrentStreamedMessage("")
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to send message:", error)
        setChatHistory((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: "npc",
            content: "Sorry, I got distracted. What were you saying?",
            timestamp: Date.now(),
          },
        ])
      }
    } finally {
      setIsTyping(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle expand/collapse
  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleClose = () => {
    setIsExpanded(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    onClose?.()
  }

  if (!isPlayerNearby || chatHistory.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute z-50"
        style={{
          left: position.x - (isExpanded ? 160 : 100),
          top: position.y - (isExpanded ? 280 : 80),
        }}
      >
        {/* Collapsed view - just speech bubble */}
        {!isExpanded ? (
          <div
            className={`relative rounded-lg border-2 p-3 shadow-lg max-w-xs cursor-pointer hover:shadow-xl transition-shadow ${style.bg} ${style.border}`}
            onClick={handleExpand}
          >
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div
                className={`w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${style.border.replace("border-", "border-t-")}`}
              />
            </div>

            <div className={`text-xs font-bold mb-1 ${style.text}`}>{npcName}</div>
            <div className={`text-sm ${style.text}`}>
              {chatHistory[chatHistory.length - 1]?.content}
            </div>

            <div className={`flex items-center gap-1 text-xs mt-2 opacity-60 ${style.text}`}>
              <MessageCircle size={12} />
              <span>{isTouchDevice ? "Tap to chat" : "Click to chat"}</span>
            </div>
          </div>
        ) : (
          /* Expanded chat view - responsive size */
          <motion.div
            initial={{ width: 200, height: 100 }}
            animate={{ width: isTouchDevice ? 280 : 320, height: isTouchDevice ? 260 : 300 }}
            className={`relative rounded-lg border-2 shadow-xl overflow-hidden ${style.bg} ${style.border}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2 ${style.accent} text-white`}>
              <span className="font-bold text-sm">{npcName}</span>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat messages */}
            <div
              ref={chatContainerRef}
              className={`${isTouchDevice ? 'h-[160px]' : 'h-[200px]'} overflow-y-auto p-3 space-y-2`}
            >
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "player" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "player"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : `${style.bubble} ${style.text} rounded-bl-none`
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {currentStreamedMessage && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${style.bubble} ${style.text} rounded-bl-none`}>
                    {currentStreamedMessage}
                    <span className="inline-block w-1 h-3 ml-1 bg-current animate-pulse" />
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && !currentStreamedMessage && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-3 py-2 ${style.bubble}`}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className={`flex items-center gap-2 p-2 border-t ${style.border}`}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                disabled={isTyping}
                className={`flex-1 px-3 py-2 rounded-full text-sm border ${style.border} ${style.text} bg-white focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className={`p-2 rounded-full ${style.accent} text-white disabled:opacity-50 hover:opacity-90 transition-opacity`}
              >
                <Send size={16} />
              </button>
            </div>

            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div
                className={`w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${style.border.replace("border-", "border-t-")}`}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
