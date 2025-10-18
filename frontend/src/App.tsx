import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            CodeRed Astra 2025
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Accessible Note-Taking for Everyone
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
              Welcome to Your Accessible Notes
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <span className="text-2xl">🎤</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Speech-to-Text</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Transcribe lectures and audio automatically
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <span className="text-2xl">🔊</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Text-to-Speech</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Listen to your notes with ElevenLabs AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Chat Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ask questions, get summaries, and generate quizzes
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCount((count) => count + 1)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Increment counter"
              >
                Test Button: {count}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Accessibility Features
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Keyboard navigation support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Screen reader optimized
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                High contrast mode
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Dyslexia-friendly fonts
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
