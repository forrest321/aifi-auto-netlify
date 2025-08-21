import React, { useRef, useState } from 'react'

// Signature Pad Component for AI-Fi Document Signing
// Note: Using a simplified canvas-based signature pad for demo purposes
// In production, you would install and use react-signature-canvas:
// npm install react-signature-canvas @types/react-signature-canvas

interface SignaturePadProps {
  onSignature: (signature: string) => void
  onClear?: () => void
  customerName?: string
  documentType?: string
  width?: number
  height?: number
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignature,
  onClear,
  customerName,
  documentType,
  width = 400,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      setIsDrawing(true)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
      onClear?.()
    }
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signatureData = canvas.toDataURL()
    onSignature(signatureData)
  }

  // Initialize canvas drawing context
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  return (
    <div className="signature-pad-container bg-white border border-gray-300 rounded-lg p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Electronic Signature Required
        </h3>
        {documentType && (
          <p className="text-sm text-gray-600">
            Document: {documentType}
          </p>
        )}
        {customerName && (
          <p className="text-sm text-gray-600">
            Customer: {customerName}
          </p>
        )}
      </div>

      {/* Signature Canvas */}
      <div className="border border-gray-400 rounded mb-4 bg-white">
        <div className="p-2 bg-gray-50 border-b text-sm text-gray-600">
          Please sign below:
        </div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ width: '100%', height: height }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearSignature}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={!hasSignature}
          className={`px-6 py-2 text-sm rounded transition-colors ${
            hasSignature
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Apply Signature
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500">
        <p>
          By signing above, you acknowledge that this electronic signature has the same legal effect 
          as a handwritten signature and constitutes your acceptance of the terms contained in this document.
        </p>
      </div>
    </div>
  )
}

export default SignaturePad