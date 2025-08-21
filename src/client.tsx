import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'

import { createRouter } from './router'

const router = createRouter()

function startClient() {
  hydrateRoot(document, <StartClient router={router} />)
}

// Execute client hydration immediately
startClient()

// Export as default to satisfy build requirements
export default startClient
