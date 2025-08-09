import { useState } from 'react'
import { PlusCircle, Trash2, Globe, ChevronDown } from 'lucide-react'
import { useAppState } from '../store/hooks'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

// Venice models available for selection
const VENICE_MODELS = [
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'Latest Llama model with 70B parameters' },
  { id: 'venice-uncensored', name: 'Venice Uncensored', description: 'Venice\'s default uncensored model' },
  { id: 'dolphin-2.9.2-qwen2-72b', name: 'Dolphin Qwen2 72B', description: 'Advanced reasoning model' },
  { id: 'gpt-4o', name: 'GPT-4 Omni', description: 'OpenAI\'s latest multimodal model' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Anthropic\'s Claude model' },
]

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [promptForm, setPromptForm] = useState({ name: '', content: '' })
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const { prompts, settings, createPrompt, deletePrompt, setPromptActive, updateSettings } = useAppState()

  const handleAddPrompt = () => {
    if (!promptForm.name.trim() || !promptForm.content.trim()) return
    createPrompt(promptForm.name, promptForm.content)
    setPromptForm({ name: '', content: '' })
    setIsAddingPrompt(false)
  }

  const handleClose = () => {
    onClose()
    setIsAddingPrompt(false)
    setPromptForm({ name: '', content: '' })
    setShowModelDropdown(false)
  }

  const selectedModel = VENICE_MODELS.find(m => m.id === settings.model) || VENICE_MODELS[0]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose()
    }}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Settings</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                AI Model
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-white bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <div>
                    <div className="font-medium">{selectedModel.name}</div>
                    <div className="text-xs text-gray-400">{selectedModel.description}</div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showModelDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                    {VENICE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          updateSettings({ model: model.id })
                          setShowModelDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg ${
                          model.id === settings.model ? 'bg-gray-600' : ''
                        }`}
                      >
                        <div className="font-medium text-white">{model.name}</div>
                        <div className="text-xs text-gray-400">{model.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Choose the AI model for generating responses. Different models have different capabilities and specializations.
              </p>
            </div>

            {/* Web Search Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-white">
                    Web Search
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Enable web search to get up-to-date information in responses
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.webSearchEnabled}
                    onChange={() => updateSettings({ webSearchEnabled: !settings.webSearchEnabled })}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  <Globe className="ml-2 w-4 h-4 text-gray-400 peer-checked:text-orange-500" />
                </label>
              </div>
            </div>

            {/* Prompts Management */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-white">
                  System Prompts
                </label>
                <button
                  onClick={() => setIsAddingPrompt(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Prompt
                </button>
              </div>

              {isAddingPrompt && (
                <div className="p-3 mb-4 space-y-3 rounded-lg bg-gray-700/50">
                  <input
                    type="text"
                    value={promptForm.name}
                    onChange={(e) => setPromptForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Prompt name..."
                    className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <textarea
                    value={promptForm.content}
                    onChange={(e) => setPromptForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter prompt content..."
                    className="w-full h-32 px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingPrompt(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPrompt}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Save Prompt
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50">
                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className="text-sm font-medium text-white truncate">{prompt.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{prompt.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={prompt.is_active}
                          onChange={() => setPromptActive(prompt.id, !prompt.is_active)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                      <button
                        onClick={() => deletePrompt(prompt.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Create and manage custom system prompts. Only one prompt can be active at a time.
              </p>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}