import { MessageCircle, Trash2, Edit2 } from 'lucide-react';
import { DebugPanel, type DebugInfo } from './DebugPanel';

interface SidebarProps {
  conversations: Array<{ id: string; title: string }>;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string) => void;
  handleDeleteChat: (id: string) => void;
  editingChatId: string | null;
  setEditingChatId: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  handleUpdateChatTitle: (id: string, title: string) => void;
  debugInfo?: DebugInfo;
}

export const Sidebar = ({ 
  conversations, 
  currentConversationId, 
  setCurrentConversationId, 
  handleDeleteChat, 
  editingChatId, 
  setEditingChatId, 
  editingTitle, 
  setEditingTitle, 
  handleUpdateChatTitle,
  debugInfo
}: SidebarProps) => (
  <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700 relative">
    {/* Main content area with flex layout */}
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat List - will shrink if needed */}
      <div className={`${debugInfo ? 'flex-shrink' : 'flex-1'} overflow-y-auto min-h-[200px]`}>
        {conversations.map((chat) => (
        <div
          key={chat.id}
          className={`group flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-700/50 ${
            chat.id === currentConversationId ? 'bg-gray-700/50' : ''
          }`}
          onClick={() => setCurrentConversationId(chat.id)}
        >
          <MessageCircle className="w-4 h-4 text-gray-400" />
          {editingChatId === chat.id ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (editingTitle.trim()) {
                  handleUpdateChatTitle(chat.id, editingTitle)
                }
                setEditingChatId(null)
                setEditingTitle('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingTitle.trim()) {
                  handleUpdateChatTitle(chat.id, editingTitle)
                } else if (e.key === 'Escape') {
                  setEditingChatId(null)
                  setEditingTitle('')
                }
              }}
              className="flex-1 text-sm text-white bg-transparent focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm text-gray-300 truncate">
              {chat.title}
            </span>
          )}
          <div className="items-center hidden gap-1 group-hover:flex">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditingChatId(chat.id)
                setEditingTitle(chat.title)
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteChat(chat.id)
              }}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
      </div>
      
      {/* Debug Panel - takes remaining space with bottom padding for router button */}
      {debugInfo && (
        <div className="flex-1 min-h-0 pb-16">
          <DebugPanel debugInfo={debugInfo} />
        </div>
      )}
    </div>
  </div>
); 