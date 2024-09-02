import { useState, useEffect } from 'react'

const useKeyCode = (targetSequence, onSequenceDetected, duration = 2000) => {
  const [keySequence, setKeySequence] = useState('')
  const [lastKeyPressTime, setLastKeyPressTime] = useState(Date.now())
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event) => {
      let key = event.key

      if (key === ' ') key = 'Space'
      if (key === 'ArrowUp') key = '↑'
      if (key === 'ArrowDown') key = '↓'
      if (key === 'ArrowLeft') key = '←'
      if (key === 'ArrowRight') key = '→'

      const currentTime = Date.now()

      if (currentTime - lastKeyPressTime > duration) {
        setKeySequence('')
        setSuccess(false)
      }

      setLastKeyPressTime(currentTime)

      setKeySequence((prevSequence) => {
        const updatedSequence = prevSequence + key

        if (updatedSequence.includes(targetSequence)) {
          onSequenceDetected()
          setSuccess(true)
          return ''
        }

        return updatedSequence.slice(-targetSequence.length)
      })
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [targetSequence, onSequenceDetected, duration, lastKeyPressTime])

  return { success, keySequence }
}

export default useKeyCode
