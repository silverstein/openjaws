'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-red-900 to-red-950 text-white">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🦈</div>
            <h1 className="text-3xl font-bold mb-4">Something went wrong!</h1>
            <p className="text-red-200 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-white text-red-900 px-6 py-3 rounded-lg font-bold hover:bg-red-100 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Reload Game
              </button>
              <button
                onClick={() => window.location.href = '/lobby'}
                className="w-full bg-transparent border border-red-400 text-red-200 px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
