import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
}

export function Tooltip({ text }: Props) {
  const [show, setShow] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX - 100
      })
    }
  }, [show])

  return (
    <span className="inline-block ml-2">
      <button
        ref={buttonRef}
        type="button"
        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold inline-flex items-center justify-center cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </button>
      {show && createPortal(
        <div
          className="fixed z-[9999] w-64 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xl"
          style={{ top: position.top, left: Math.max(10, position.left) }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {text}
        </div>,
        document.body
      )}
    </span>
  )
}
