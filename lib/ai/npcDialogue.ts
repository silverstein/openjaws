import { streamText } from "ai"
import { determineAIMode, trackAPIUsage, updateCurrentMode } from "./apiTracking"
import { aiConfig, models } from "./config"
import { generateMockNPCResponse, type npcMockResponses } from "./mockResponses"
import { responseCache } from "./responseCache"

export type NPCType =
  | "beach_vendor" // Sells items, knows beach gossip
  | "lifeguard" // Safety warnings, shark sightings
  | "tourist" // Panicky, provides comic relief
  | "surfer" // Chill vibes, shark encounter stories
  | "scientist" // Marine biology facts, shark behavior
  | "reporter" // Dramatic news updates
  | "old_timer" // Beach history, past shark attacks
  | "fish_vendor" // Fish market vendor, sells bait and fish

export interface NPCContext {
  npcType: NPCType
  npcName: string
  playerName: string
  currentEvent?: "shark_nearby" | "player_hurt" | "calm" | "storm" | "shark_attack"
  recentSharkSighting?: boolean
  timeOfDay: "dawn" | "day" | "dusk" | "night"
  previousMessages?: string[]
}

const npcPersonalities: Record<NPCType, string> = {
  beach_vendor: `You're a cheerful beach vendor who sells snacks and beach gear. You love gossip and always have the latest beach news. You speak casually with a slight salesperson vibe.`,
  lifeguard: `You're a responsible lifeguard, always concerned about beach safety. You're professional but friendly, often warning about dangers while trying not to cause panic.`,
  tourist: `You're an excited tourist on vacation. You're easily frightened but try to stay positive. You often reference your hometown and take lots of photos.`,
  surfer: `You're a laid-back surfer who's been riding these waves for years. You speak with surfer slang and have a chill attitude even about sharks. You've got stories.`,
  scientist: `You're a marine biologist studying local shark behavior. You speak with scientific accuracy but try to make it accessible. You're fascinated rather than frightened by sharks.`,
  reporter: `You're a dramatic news reporter always looking for the big story. You speak in headlines and love to sensationalize events while maintaining some journalistic integrity.`,
  old_timer: `You're a beach local who's seen it all. You remember the "great shark summer of '87" and love sharing stories. You're wise but slightly cynical about beach safety.`,
  fish_vendor: `You're Captain Bill, a grizzled fisherman who's been battling that shark for thirty years. You run the beach fish market with salty humor and a personal vendetta. Every sale is an act of revenge against the beast that ate your grandfather's boat, took your best fishing spots, and owes you decades of lost catches. You mix practical advice with colorful stories, always ending with a sales pitch. You're petty, proud, and secretly love the chaos.`,
}

const eventPrompts: Record<string, string> = {
  shark_nearby: "There's a shark fin visible in the water nearby!",
  player_hurt: "The player appears to be injured!",
  calm: "The beach is peaceful and calm.",
  storm: "A storm is rolling in, making the waters dangerous!",
  shark_attack: "A shark attack is happening right now!",
}

export async function* streamNPCResponse(
  context: NPCContext,
  playerMessage: string
): AsyncGenerator<string> {
  const mode = determineAIMode()
  updateCurrentMode(mode)

  // Check cache first
  const cacheKey = `${context.npcType}:${context.currentEvent || "dialogue"}`
  const cached = responseCache.getCachedNPCResponse(cacheKey, playerMessage)

  if (cached && (mode === "cached" || (mode === "mock" && Math.random() < 0.5))) {
    console.log(`[NPC] Using cached response in ${mode} mode`)
    // Stream the cached response
    const words = cached.split(" ")
    for (const word of words) {
      yield `${word} `
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    return
  }

  // Use mock response if in mock mode
  if (mode === "mock") {
    console.log("[NPC] Using mock response")
    const mockResponse = generateMockNPCResponse(
      context.npcType as keyof typeof npcMockResponses,
      "dialogue"
    )

    // Cache the mock response
    responseCache.cacheNPCResponse(context.npcType, playerMessage, mockResponse, 0.7)

    // Stream the mock response
    const words = mockResponse.split(" ")
    for (const word of words) {
      yield `${word} `
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    return
  }

  // Real AI call
  const conversationHistory =
    context.previousMessages?.join("\n") || "This is your first interaction."

  const prompt = `You are ${context.npcName}, a ${context.npcType.replace("_", " ")}.
${npcPersonalities[context.npcType]}

Current situation:
- Time: ${context.timeOfDay}
- Event: ${context.currentEvent ? eventPrompts[context.currentEvent] : eventPrompts["calm"]}
- Recent shark sighting: ${context.recentSharkSighting ? "Yes, very recently!" : "No"}

Previous conversation:
${conversationHistory}

The player "${context.playerName}" just said: "${playerMessage}"

Respond naturally and in character. Keep responses brief (1-3 sentences) unless the player asks for more detail. 
If there's danger, balance your personality with appropriate concern.`

  try {
    trackAPIUsage("npc")

    const stream = await streamText({
      model: models.npcDialogue,
      prompt,
      temperature: aiConfig.temperature.npc,
      maxOutputTokens: aiConfig.maxTokens.npc,
    })

    let fullResponse = ""
    for await (const chunk of stream.textStream) {
      fullResponse += chunk
      yield chunk
    }

    // Cache the real response
    responseCache.cacheNPCResponse(context.npcType, playerMessage, fullResponse, 0.9)
  } catch (error) {
    console.error("Failed to stream NPC response:", error)
    // Fallback to mock
    const mockResponse = generateMockNPCResponse(
      context.npcType as keyof typeof npcMockResponses,
      "dialogue"
    )

    const words = mockResponse.split(" ")
    for (const word of words) {
      yield `${word} `
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
  }
}

export async function generateNPCGreeting(context: NPCContext): Promise<string> {
  const mode = determineAIMode()
  updateCurrentMode(mode)

  // Check cache first
  const cacheKey = `${context.npcType}:greeting:${context.currentEvent || "default"}`
  const cached = responseCache.getCachedNPCResponse(cacheKey, "greeting")

  if (cached && (mode === "cached" || mode === "mock")) {
    console.log(`[NPC] Using cached greeting in ${mode} mode`)
    return cached
  }

  // Use mock greeting if in mock mode
  if (mode === "mock") {
    console.log("[NPC] Using mock greeting")
    const mockGreeting = generateMockNPCResponse(
      context.npcType as keyof typeof npcMockResponses,
      "greeting"
    )
    responseCache.cacheNPCResponse(cacheKey, "greeting", mockGreeting, 0.7)
    return mockGreeting
  }

  // Real AI call
  const prompt = `You are ${context.npcName}, a ${context.npcType.replace("_", " ")}.
${npcPersonalities[context.npcType]}

Current situation:
- Time: ${context.timeOfDay}
- Event: ${context.currentEvent ? eventPrompts[context.currentEvent] : eventPrompts["calm"]}
- Recent shark sighting: ${context.recentSharkSighting ? "Yes!" : "No"}

A player named "${context.playerName}" just approached you. Give them a brief, in-character greeting (1-2 sentences).
${context.currentEvent === "shark_nearby" || context.currentEvent === "shark_attack" ? "Address the danger!" : ""}`

  try {
    trackAPIUsage("npc")

    const stream = await streamText({
      model: models.npcDialogue,
      prompt,
      temperature: aiConfig.temperature.npc,
      maxOutputTokens: 100,
    })

    let greeting = ""
    for await (const chunk of stream.textStream) {
      greeting += chunk
    }

    // Cache the real response
    responseCache.cacheNPCResponse(cacheKey, "greeting", greeting, 0.9)

    return greeting
  } catch (error) {
    console.error("Failed to generate NPC greeting:", error)
    // Fallback to mock
    const mockGreeting = generateMockNPCResponse(
      context.npcType as keyof typeof npcMockResponses,
      "greeting"
    )
    return mockGreeting
  }
}

export function generateQuickNPCReaction(
  npcType: NPCType,
  event: "shark_spotted" | "player_eaten" | "shark_defeated" | "storm_coming"
): string {
  // Quick pre-generated reactions for common events to reduce API calls
  const reactions: Record<string, Record<NPCType, string[]>> = {
    shark_spotted: {
      beach_vendor: ["Shark! Everyone out of the water!", "Oh no, not again! Bad for business!"],
      lifeguard: [
        "SHARK! Everyone exit the water immediately!",
        "Clear the water! Shark sighting!",
      ],
      tourist: ["Is that a... SHARK?! *drops camera*", "I want to go home!"],
      surfer: ["Whoa, big guy's back. Gnarly.", "Time to catch waves elsewhere, dude."],
      scientist: [
        "Fascinating! Appears to be hunting behavior.",
        "Remarkable! Note the dorsal fin angle.",
      ],
      reporter: ["This is it! The story of the summer!", "Breaking news: Shark in the water!"],
      old_timer: ["Here we go again... just like '87.", "Seen bigger. But still, get out."],
      fish_vendor: ["HA! There's my thirty-year nemesis! Who wants chum?!", "That overgrown sardine again! Bad for business, good for revenge!"],
    },
    player_eaten: {
      beach_vendor: ["Oh my... I think I'm closing early today.", "That's... that's horrible!"],
      lifeguard: ["No! I... I couldn't save them!", "Medical! We need medical NOW!"],
      tourist: ["*screaming* This vacation is ruined!", "I can't look! Oh god!"],
      surfer: ["Heavy... Real heavy, man.", "Poor soul. The ocean gives and takes."],
      scientist: [
        "Predation event confirmed. Tragic but natural.",
        "Classic ambush pattern. Unfortunate.",
      ],
      reporter: ["Tragedy strikes! A life lost to the deep!", "Viewers, this is devastating..."],
      old_timer: ["Another one for the memorial wall.", "Should've listened to the warnings."],
      fish_vendor: ["Blast it all! Another one owes me money now...", "Should've bought that premium mackerel! I TOLD them!"],
    },
    shark_defeated: {
      beach_vendor: ["Is it over? Can I reopen?", "Heroes! You're all getting discounts!"],
      lifeguard: ["Incredible! The beach is safe again!", "That was amazing teamwork!"],
      tourist: ["You beat it! *takes selfie with heroes*", "Best. Vacation. Story. EVER!"],
      surfer: ["Respect to the shark, respect to you.", "Epic battle, dudes. Legendary."],
      scientist: ["Remarkable survival adaptation by the players.", "This data is invaluable!"],
      reporter: ["BREAKING: Shark defeated by brave beachgoers!", "Exclusive footage coming up!"],
      old_timer: [
        "Well I'll be... Haven't seen that since '87.",
        "You've earned your place in beach history.",
      ],
      fish_vendor: ["THIRTY YEARS! Finally got that oversized mackerel! Drinks are on the house!", "You beautiful maniacs! That's for my grandfather's boat!"],
    },
    storm_coming: {
      beach_vendor: ["Storm's coming! I'm packing up!", "Better buy supplies now!"],
      lifeguard: ["Storm warning! Everyone off the beach!", "Dangerous conditions approaching!"],
      tourist: ["A storm too?! What kind of vacation is this?", "First sharks, now this?"],
      surfer: ["Storm swells coming. Could be epic... or deadly.", "Nature's throwing a party."],
      scientist: ["Barometric pressure dropping rapidly.", "This could affect shark behavior..."],
      reporter: ["Weather alert! Storm approaching the coast!", "Stay tuned for updates!"],
      old_timer: ["Storm and sharks... bad combination.", "Seen this before. Take shelter."],
      fish_vendor: ["Storm coming! Even that shark knows to hide. Buy something before I close up!", "Mother Nature's throwing a tantrum! Good time to stock up on bait!"],
    },
  }

  const eventReactions = reactions[event as keyof typeof reactions]
  if (!eventReactions) return "Something happened!"
  const npcReactions = eventReactions[npcType as keyof typeof eventReactions]
  if (!npcReactions) return "Hmm..."
  return npcReactions[Math.floor(Math.random() * npcReactions.length)] ?? "..."
}
