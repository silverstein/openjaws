"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const SHARK_MESSAGES = [
  "The shark ate the game! 🦈💥",
  "Even the shark is confused by this one...",
  "CHOMP! The game got eaten.",
  "The shark broke something. Classic.",
  "Technical difficulties... the shark is investigating.",
]

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      const message = SHARK_MESSAGES[Math.floor(Math.random() * SHARK_MESSAGES.length)]

      return (
        <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-600 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🦈</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{message}</h1>
            <p className="text-gray-500 text-sm mb-6">
              Something went wrong loading the game.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Try Again
              </button>
              <a
                href="/lobby"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Back to Lobby
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
