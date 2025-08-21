import { ChevronDown, ChevronRight, Bot, User, Database, Brain } from 'lucide-react';
import { useState } from 'react';

export interface DebugInfo {
  lastAgent?: string;
  lastAction?: string;
  currentUser?: {
    name?: string;
    phone?: string;
    userType?: string;
    verificationStatus?: boolean;
    currentDealId?: string;
    stage?: string;
  };
  dealNumber?: string;
  systemMode?: 'AI-Fi' | 'Venice' | 'Unknown';
  conversationId?: string;
  messageCount?: number;
  lastError?: string;
}

interface DebugPanelProps {
  debugInfo: DebugInfo;
}

export const DebugPanel = ({ debugInfo }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="h-full flex flex-col border-t border-gray-700 bg-gray-900/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-300">Debug Info</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 px-4 py-4 space-y-3 text-xs overflow-y-auto">
          {/* System Mode */}
          <div className="space-y-1">
            <div className="text-gray-500 uppercase tracking-wider">System Mode</div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded ${
                debugInfo.systemMode === 'AI-Fi' 
                  ? 'bg-green-500/20 text-green-400' 
                  : debugInfo.systemMode === 'Venice'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {debugInfo.systemMode || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Last Agent */}
          {debugInfo.lastAgent && (
            <div className="space-y-1">
              <div className="text-gray-500 uppercase tracking-wider">Last Agent</div>
              <div className="flex items-center gap-2">
                <Bot className="w-3 h-3 text-orange-400" />
                <span className="text-gray-300">{debugInfo.lastAgent}</span>
              </div>
              {debugInfo.lastAction && (
                <div className="text-gray-400 pl-5">Action: {debugInfo.lastAction}</div>
              )}
            </div>
          )}

          {/* Current User */}
          {debugInfo.currentUser && (
            <div className="space-y-1">
              <div className="text-gray-500 uppercase tracking-wider">Current User</div>
              <div className="space-y-1 text-gray-300">
                {debugInfo.currentUser.name && (
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{debugInfo.currentUser.name}</span>
                  </div>
                )}
                {debugInfo.currentUser.userType && (
                  <div className="pl-5">Type: {debugInfo.currentUser.userType}</div>
                )}
                {debugInfo.currentUser.stage && (
                  <div className="pl-5">Stage: {debugInfo.currentUser.stage}</div>
                )}
                <div className="pl-5">
                  Verified: {debugInfo.currentUser.verificationStatus ? '✅' : '❌'}
                </div>
              </div>
            </div>
          )}

          {/* Deal Info */}
          {debugInfo.dealNumber && (
            <div className="space-y-1">
              <div className="text-gray-500 uppercase tracking-wider">Deal Info</div>
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-purple-400" />
                <span className="text-gray-300">Deal #{debugInfo.dealNumber}</span>
              </div>
            </div>
          )}


          {/* Conversation Stats */}
          <div className="space-y-1">
            <div className="text-gray-500 uppercase tracking-wider">Session Stats</div>
            <div className="text-gray-400 space-y-1">
              {debugInfo.conversationId && (
                <div className="truncate">
                  ID: {debugInfo.conversationId.slice(0, 8)}...
                </div>
              )}
              {debugInfo.messageCount !== undefined && (
                <div>Messages: {debugInfo.messageCount}</div>
              )}
            </div>
          </div>

          {/* Last Error */}
          {debugInfo.lastError && (
            <div className="space-y-1">
              <div className="text-red-500 uppercase tracking-wider">Last Error</div>
              <div className="text-red-400 text-xs break-words">
                {debugInfo.lastError}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};