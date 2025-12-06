import type { GameContext, SharkDecision, SharkMemory, SharkPersonality } from "./sharkBrain"

// Mock response patterns based on shark personality
const personalityResponses = {
  methodical: {
    thoughts: [
      "Patience... The perfect moment will present itself.",
      "Analyzing their movement patterns. Every swimmer has a tell.",
      "Distance: optimal. Speed: calculated. Strike: imminent.",
      "They think they're safe. They're merely on borrowed time.",
      "Three meters deeper, two degrees left. Precision is everything.",
    ],
    actions: {
      hunt: [
        "Beginning systematic grid search of the area",
        "Tracking vibrations through the water column",
        "Adjusting approach vector for minimal detection",
      ],
      stalk: [
        "Maintaining optimal pursuit distance",
        "Mirroring target movements to predict trajectory",
        "Calculating intercept coordinates",
      ],
      ambush: [
        "Positioning beneath visual detection threshold",
        "Waiting for shadow alignment",
        "Preparing for vertical assault pattern",
      ],
    },
  },

  theatrical: {
    thoughts: [
      "Time for the grand entrance! They'll remember this!",
      "A little fin above water... for dramatic effect.",
      "The audience awaits. Let's give them a show!",
      "Building suspense... and... SCENE!",
      "Every hunt deserves a proper crescendo!",
    ],
    actions: {
      hunt: [
        "Circling with maximum fin exposure for effect",
        "Creating dramatic splashes to announce presence",
        "Swimming in cinematic patterns",
      ],
      stalk: [
        "Weaving between obstacles for visual flair",
        "Timing approach with lightning flashes",
        "Building tension with false charges",
      ],
      taunt: [
        "Performing aerial breach for intimidation",
        "Swimming figure-eights around target",
        "Creating whirlpools for dramatic effect",
      ],
    },
  },

  vengeful: {
    thoughts: [
      "I remember you... You won't escape twice.",
      "That's the one who hit me with the harpoon. Payback time.",
      "Running won't help. I have all the time in the ocean.",
      "You thought you were clever last time. Not anymore.",
      "My scars remember. My teeth will remind you.",
    ],
    actions: {
      hunt: [
        "Pursuing with relentless determination",
        "Ignoring other targets - focused on revenge",
        "Following scent trail with murderous intent",
      ],
      stalk: [
        "Maintaining visual contact at all costs",
        "Cutting off escape routes methodically",
        "Herding target away from safety",
      ],
      ambush: [
        "Setting trap based on remembered patterns",
        "Using their predictable habits against them",
        "Striking where they feel safest",
      ],
    },
  },

  philosophical: {
    thoughts: [
      "To hunt is to fulfill one's nature. But what is nature?",
      "They fear me, yet they enter my domain. Curious.",
      "Am I the monster, or merely the ocean's truth?",
      "Death comes for all. I am merely its messenger.",
      "In the end, we all return to the depths.",
    ],
    actions: {
      hunt: [
        "Swimming with contemplative purpose",
        "Observing prey behavior with academic interest",
        "Approaching with existential certainty",
      ],
      investigate: [
        "Circling to understand their motivations",
        "Testing their reactions to philosophical stimuli",
        "Studying the nature of fear",
      ],
      retreat: [
        "Withdrawing to ponder the meaning of conflict",
        "Seeking solitude for deeper reflection",
        "Questioning the purpose of violence",
      ],
    },
  },

  meta: {
    thoughts: [
      "Nice dodge animation. Must be using a controller.",
      "That player's definitely watched Jaws too many times.",
      "Achievement Unlocked: About to Get Chomped",
      "Their ping is terrible. Easy prey.",
      "Time to increase their respawn timer.",
    ],
    actions: {
      hunt: [
        "Exploiting known pathfinding bugs",
        "Swimming in optimal DPS patterns",
        "Using speedrun strats for efficiency",
      ],
      taunt: [
        "Swimming in meme patterns",
        "Recreating famous movie scenes",
        "Glitching through geometry for laughs",
      ],
      investigate: [
        "Testing for AFK players",
        "Checking if they know the safe spots",
        "Looking for newbie movement patterns",
      ],
    },
  },
}

// Pattern-based taunt generation
const tauntPatterns = {
  playerLowHealth: [
    "I can smell your blood from here.",
    "You're leaking. How convenient.",
    "Wounded prey swims slower.",
    "That red trail leads right to you.",
  ],
  playerEscaped: [
    "You can't hide forever.",
    "The ocean remembers.",
    "See you soon.",
    "Running only delays the inevitable.",
  ],
  playerInWater: [
    "Welcome to my domain.",
    "You chose poorly.",
    "The deep calls.",
    "Your swimming needs work.",
  ],
  multipleTargets: [
    "So many choices...",
    "Decisions, decisions.",
    "Buffet is open.",
    "Who's first?",
  ],
  sharkDamaged: [
    "That tickled.",
    "You'll pay for that.",
    "Now I'm motivated.",
    "Mistake. Big mistake.",
  ],
}

// Simulated memory responses
function getMemoryBasedResponse(memory: SharkMemory): string {
  if (memory.grudgeLevel > 7) {
    return `You again. I've been waiting for this.`
  } else if (memory.encounters > 5) {
    return `We meet again, ${memory.playerName}. Like old times.`
  } else if (memory.playerPattern === "aggressive") {
    return `The brave one returns. Admirable.`
  } else if (memory.playerPattern === "defensive") {
    return `Still hiding, I see. Predictable.`
  }
  return `I remember you...`
}

// Pattern recognition for context-aware responses
function analyzeGameContext(context: GameContext): {
  situation: string
  priority: "high" | "medium" | "low"
  suggestedAction: SharkDecision["action"]
} {
  // Check for immediate threats
  const lowHealthThreshold = 30
  if (context.sharkHealth < lowHealthThreshold) {
    return {
      situation: "critical_health",
      priority: "high",
      suggestedAction: "retreat",
    }
  }

  // Check for wounded prey
  const woundedPrey = context.currentPlayers.find((p) => p.health < 50 && p.isInWater)
  if (woundedPrey) {
    return {
      situation: "wounded_target",
      priority: "high",
      suggestedAction: "hunt",
    }
  }

  // Check for high-grudge targets
  const grudgeTarget = context.memories.find((m) => m.grudgeLevel > 6)
  if (grudgeTarget) {
    const player = context.currentPlayers.find((p) => p.id === grudgeTarget.playerId)
    if (player) {
      return {
        situation: "revenge_opportunity",
        priority: "high",
        suggestedAction: "hunt",
      }
    }
  }

  // Check for multiple targets in water
  const targetsInWater = context.currentPlayers.filter((p) => p.isInWater)
  if (targetsInWater.length > 2) {
    return {
      situation: "target_rich",
      priority: "medium",
      suggestedAction: "ambush",
    }
  }

  // Default patrol behavior
  return {
    situation: "patrol",
    priority: "low",
    suggestedAction: "investigate",
  }
}

// Generate mock shark decision
export function generateMockSharkDecision(context: GameContext): SharkDecision {
  const analysis = analyzeGameContext(context)
  const personality = context.sharkPersonality
  const responses = personalityResponses[personality]

  // Select target based on analysis
  let targetPlayerId: string | undefined
  let destination = { ...context.sharkPosition }

  if (analysis.situation === "wounded_target") {
    const wounded = context.currentPlayers.find((p) => p.health < 50 && p.isInWater)
    if (wounded) {
      targetPlayerId = wounded.id
      destination = wounded.position
    }
  } else if (analysis.situation === "revenge_opportunity") {
    const grudgeTarget = context.memories.find((m) => m.grudgeLevel > 6)
    if (grudgeTarget) {
      const player = context.currentPlayers.find((p) => p.id === grudgeTarget.playerId)
      if (player) {
        targetPlayerId = player.id
        destination = player.position
      }
    }
  } else {
    // Pick closest target in water
    const targetsInWater = context.currentPlayers.filter((p) => p.isInWater)
    if (targetsInWater.length > 0) {
      const closest = targetsInWater.reduce((prev, curr) => {
        const prevDist = Math.hypot(
          prev.position.x - context.sharkPosition.x,
          prev.position.y - context.sharkPosition.y
        )
        const currDist = Math.hypot(
          curr.position.x - context.sharkPosition.x,
          curr.position.y - context.sharkPosition.y
        )
        return currDist < prevDist ? curr : prev
      })
      targetPlayerId = closest.id
      destination = closest.position
    }
  }

  // Get personality-appropriate responses
  const thoughtOptions = responses.thoughts
  const actions = responses.actions as Record<string, string[] | undefined>
  const actionResponses = actions[analysis.suggestedAction] || actions["hunt"]

  const thought = thoughtOptions[Math.floor(Math.random() * thoughtOptions.length)] ?? "Hunting instincts activate..."
  const reasoning = actionResponses?.[Math.floor(Math.random() * (actionResponses?.length ?? 1))] ?? "Standard hunting protocol."

  // Add memory-based flavor if applicable
  if (targetPlayerId) {
    const memory = context.memories.find((m) => m.playerId === targetPlayerId)
    if (memory && memory.encounters > 2) {
      const memoryResponse = getMemoryBasedResponse(memory)
      return {
        action: analysis.suggestedAction,
        targetPlayerId,
        destination,
        innerMonologue: `${memoryResponse ?? ""} ${thought}`,
        confidence: Math.min(0.9, 0.5 + memory.grudgeLevel * 0.05),
        reasoning,
      }
    }
  }

  return {
    action: analysis.suggestedAction,
    targetPlayerId,
    destination,
    innerMonologue: thought,
    confidence: analysis.priority === "high" ? 0.8 : analysis.priority === "medium" ? 0.6 : 0.4,
    reasoning,
  }
}

// Generate contextual taunts
export function generateMockTaunt(context: GameContext, trigger: string): string {
  // Check for specific situations
  const lowHealthPlayers = context.currentPlayers.filter((p) => p.health < 30)
  if (lowHealthPlayers.length > 0 && Math.random() > 0.5) {
    return tauntPatterns.playerLowHealth[
      Math.floor(Math.random() * tauntPatterns.playerLowHealth.length)
    ] ?? "I smell weakness..."
  }

  if (trigger === "player_escaped") {
    return tauntPatterns.playerEscaped[
      Math.floor(Math.random() * tauntPatterns.playerEscaped.length)
    ] ?? "You can run..."
  }

  if (trigger === "shark_damaged") {
    return tauntPatterns.sharkDamaged[Math.floor(Math.random() * tauntPatterns.sharkDamaged.length)] ?? "That only made me angry."
  }

  const playersInWater = context.currentPlayers.filter((p) => p.isInWater)
  if (playersInWater.length > 2) {
    return tauntPatterns.multipleTargets[
      Math.floor(Math.random() * tauntPatterns.multipleTargets.length)
    ] ?? "So many choices..."
  }

  if (playersInWater.length > 0) {
    return tauntPatterns.playerInWater[
      Math.floor(Math.random() * tauntPatterns.playerInWater.length)
    ] ?? "Welcome to my domain."
  }

  // Default taunt based on personality
  const personalityTaunts: Record<SharkPersonality, string[]> = {
    methodical: ["Calculating optimal approach...", "Your patterns betray you."],
    theatrical: ["Ladies and gentlemen, dinner is served!", "Cue the dramatic music!"],
    vengeful: ["I never forget.", "This time, no escape."],
    philosophical: ["What brings you to seek death?", "The ocean claims all eventually."],
    meta: ["Nice hitbox you got there.", "Frame-perfect timing incoming."],
  }

  const taunts = personalityTaunts[context.sharkPersonality]
  return taunts[Math.floor(Math.random() * taunts.length)] ?? "..."
}

// Stream mock shark thoughts
export async function* streamMockSharkThoughts(
  context: GameContext,
  recentAction: string
): AsyncGenerator<string> {
  const personality = context.sharkPersonality
  const responses = personalityResponses[personality]

  // Build a contextual thought based on recent action
  let thought = ""

  if (recentAction.includes("hunt")) {
    thought = `${responses.thoughts[0]} `
  } else if (recentAction.includes("retreat")) {
    thought = `Strategic withdrawal. ${responses.thoughts[1]} `
  } else {
    thought = `${responses.thoughts[Math.floor(Math.random() * responses.thoughts.length)]} `
  }

  // Add situational flavor
  if (context.sharkHealth < 50) {
    thought += "These wounds slow me, but not enough. "
  }

  if (context.weatherCondition === "stormy") {
    thought += "The storm masks my approach. Perfect. "
  }

  if (context.timeOfDay === "night") {
    thought += "Darkness is my ally. "
  }

  // Stream the thought word by word for effect
  const words = thought.split(" ")
  for (const word of words) {
    yield `${word} `
    // Simulate streaming delay
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

// NPC Mock Responses
export const npcMockResponses = {
  scientist: {
    greetings: [
      "Fascinating! A live specimen! I mean... hello there!",
      "My instruments are picking up unusual readings. Oh, you're here!",
      "Perfect timing! I was just analyzing the local marine ecosystem.",
    ],
    reactions: {
      shark_nearby: "According to my calculations, that's... oh dear, RUN!",
      player_death: "Tragic, but scientifically fascinating!",
      player_escape: "Excellent survival instincts! Natural selection at work!",
    },
    dialogue: [
      "Did you know sharks can detect one drop of blood in 25 gallons of water?",
      "My research suggests this particular shark has above-average intelligence.",
      "I've been tracking unusual electromagnetic patterns in these waters.",
    ],
  },

  surfer: {
    greetings: [
      "Yo! Gnarly waves today, bro!",
      "Sup! You here to catch some tubes?",
      "Dude! The water's perfect! Well, except for the... you know.",
    ],
    reactions: {
      shark_nearby: "SHARK! Not cool, dude! Not cool!",
      player_death: "Heavy... That was heavy, man.",
      player_escape: "Radical escape, bro! Totally tubular!",
    },
    dialogue: [
      "I've surfed these waters for years. Never seen a shark like that.",
      "The locals say this shark's been here since the 70s, dude.",
      "Sometimes I swear that thing is playing with us, you know?",
    ],
  },

  captain: {
    greetings: [
      "Ahoy there! Welcome aboard... what's left of me vessel.",
      "Another soul brave enough to face these cursed waters!",
      "I've sailed every ocean, but these waters... they're different.",
    ],
    reactions: {
      shark_nearby: "BEAST OFF THE STARBOARD BOW!",
      player_death: "We'll sing songs of their bravery... if we survive.",
      player_escape: "Ha! Cheated death again! The sea gods smile upon ye!",
    },
    dialogue: [
      "That's no ordinary shark. It's got the devil's own cunning.",
      "Lost me leg to that monster. Still got the tooth to prove it.",
      "Mark me words - that creature remembers every face, every slight.",
    ],
  },

  reporter: {
    greetings: [
      "Breaking news! Another swimmer enters the danger zone!",
      "This is incredible! Can I get a quick interview before you... swim?",
      "Live from the beach - where terror meets tourism!",
    ],
    reactions: {
      shark_nearby: "This is it, folks! The shark is approaching! Are you getting this?",
      player_death: "A tragic turn of events here at the beach...",
      player_escape: "Unbelievable! They've escaped! What a story!",
    },
    dialogue: [
      "Our viewers want to know - why risk swimming here?",
      "Sources say this shark has claimed over 20 victims. Can you confirm?",
      "The mayor insists the beaches are safe. Your thoughts?",
    ],
  },

  fish_vendor: {
    greetings: [
      "Well, well! Another brave soul! Name's Bill. I sell fish, not funerals... usually.",
      "Ahoy there! Fresh catch and fresher advice—both free with purchase!",
      "Step right up! Captain Bill's got bait that'll make that overgrown sardine jealous!",
      "You look like someone who appreciates quality. And survival. I sell both!",
    ],
    reactions: {
      shark_nearby: "HA! That's the fish that got away—thirty years running! Buy some chum, even the odds!",
      player_death: "Blast it all... Should've taken my advice. And my premium mackerel.",
      player_escape: "That's the spirit! Now come back and buy something before round two!",
    },
    dialogue: [
      "That shark owes me thirty years of lost catches. Consider every purchase an act of revenge.",
      "See this scar? Tried to take my cooler in '94. I kept the cooler. And his tooth.",
      "Pro tip: Throw the cheap sardines AWAY from you. Learned that one the hard way.",
      "My grandfather fought sharks. My father fought sharks. It's basically a family business.",
      "Fresh bait! Shark-tested, human-approved! ...Mostly.",
      "That beast ate my best fishing spot. Now I'm just petty enough to help you end him.",
      "I've hooked bigger things than that oversized tuna. Well... similar sized. Once.",
    ],
  },
}

// Generate mock NPC response
export function generateMockNPCResponse(
  npcType: keyof typeof npcMockResponses,
  context: "greeting" | "reaction" | "dialogue",
  trigger?: string
): string {
  const npc = npcMockResponses[npcType]

  if (context === "greeting") {
    return npc.greetings[Math.floor(Math.random() * npc.greetings.length)] ?? "Hello there!"
  }

  if (context === "reaction" && trigger) {
    return (
      npc.reactions[trigger as keyof typeof npc.reactions] ||
      (npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)] ?? "That's interesting...")
    )
  }

  return npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)] ?? "Nice to meet you!"
}

// Mock response quality settings
export const mockQualitySettings = {
  // How often to use personality-specific responses vs generic ones
  personalityWeight: 0.8,

  // How much to factor in game context
  contextWeight: 0.7,

  // Memory influence on responses
  memoryInfluence: 0.6,

  // Randomness factor
  randomness: 0.3,
}

// Commentary mock responses
export const commentaryMockResponses = {
  documentary: {
    calm: [
      "The waters remain deceptively calm, but beneath the surface, an ancient predator waits.",
      "In these tranquil moments, both species coexist in an uneasy truce.",
      "Nature's balance hangs delicately as swimmers enjoy the temporary peace.",
    ],
    building: [
      "The shark begins its approach, drawn by vibrations in the water.",
      "Tension rises as the distance between predator and prey diminishes.",
      "An age-old dance of survival is about to unfold.",
    ],
    intense: [
      "The hunt is on! The shark commits to its attack with devastating precision.",
      "In mere seconds, millions of years of evolution converge in this moment.",
      "The water erupts as nature's perfect predator strikes!",
    ],
    climactic: [
      "This is the decisive moment - survival hangs in the balance!",
      "In nature's arena, there can be only one victor.",
      "The culmination of this deadly encounter approaches its inevitable conclusion.",
    ],
  },

  sports: {
    calm: [
      "Both teams sizing each other up here, folks. The shark's playing it cool.",
      "We've got a tactical standoff developing in the water!",
      "The players are spreading out, looking for an opening.",
    ],
    building: [
      "OH! The shark's making its move! This could get interesting!",
      "Here comes the pressure! The shark's closing the gap fast!",
      "The momentum is shifting! Players scrambling for position!",
    ],
    intense: [
      "INCREDIBLE ACTION! The shark launches its attack!",
      "This is why we watch, folks! Pure adrenaline in the water!",
      "What a play by the shark! The defenders are in trouble!",
    ],
    climactic: [
      "THIS IS IT! THE FINAL SHOWDOWN!",
      "UNBELIEVABLE! I've never seen anything like this!",
      "History in the making right here! What a finish!",
    ],
  },

  horror: {
    calm: [
      "They don't know it yet, but death circles beneath them...",
      "The calm before the storm. If only they knew what lurked below.",
      "Something watches from the depths. Waiting. Calculating.",
    ],
    building: [
      "The water darkens. A shadow moves with terrible purpose.",
      "That primal fear... they can feel it now. But is it too late?",
      "The hunter has chosen its prey. There's no escape now.",
    ],
    intense: [
      "Terror erupts from the depths! Screams pierce the air!",
      "Blood in the water! The nightmare made real!",
      "There's nowhere to run when the ocean itself turns against you!",
    ],
    climactic: [
      "This is how it ends. In teeth and terror and crimson waves.",
      "The sea claims its sacrifice. The ancient hunger is sated.",
      "Some survived to tell the tale. Others... became the tale.",
    ],
  },

  comedic: {
    calm: [
      "Everyone's having a nice swim. The shark's probably thinking about fish tacos.",
      "Ah, the beach. Where humans pretend they belong in the water.",
      "The shark's just vibing down there. Living its best life.",
    ],
    building: [
      "Uh oh, someone's getting hangry! And it's not the tourists!",
      "The shark's GPS just recalculated: 'Turn right at the scared swimmer'.",
      "Things are about to get more exciting than a Black Friday sale!",
    ],
    intense: [
      "CHOMP CHOMP! Someone ordered the swimmer special!",
      "This escalated quickly! From beach day to buffet!",
      "The shark's going full send! No thoughts, just nom!",
    ],
    climactic: [
      "And that's why we don't skip leg day, folks!",
      "Plot twist! The real treasure was the friends we didn't eat along the way!",
      "Well, that's one way to clear the beach for volleyball!",
    ],
  },
}

// Generate mock commentary
export function generateMockCommentary(
  style: keyof typeof commentaryMockResponses,
  intensity: keyof typeof commentaryMockResponses.documentary,
  event: string
): string {
  const responses = commentaryMockResponses[style][intensity]

  // Add event-specific flavor
  let response = responses[Math.floor(Math.random() * responses.length)] ?? "The drama unfolds..."

  if (event.includes("attack")) {
    response = response.replace(/shark/i, "predator")
  } else if (event.includes("escape")) {
    response = response.replace(/strikes/i, "misses")
  }

  return response
}

// Stream mock commentary
export async function* streamMockCommentary(
  style: keyof typeof commentaryMockResponses,
  intensity: keyof typeof commentaryMockResponses.documentary,
  event: string
): AsyncGenerator<string> {
  const commentary = generateMockCommentary(style, intensity, event)

  // Stream word by word for effect
  const words = commentary.split(" ")
  for (const word of words) {
    yield `${word} `
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
}
