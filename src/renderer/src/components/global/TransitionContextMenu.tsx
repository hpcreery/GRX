import { useState, useEffect } from 'react'
import { Button, Transition, Stack } from '@mantine/core'

import React from 'react'

interface TransitionContextMenuProps {
  close: () => void
  children: React.ReactNode
}

function TransitionContextMenu({ close, children, ...props }: TransitionContextMenuProps) {
  const [mounted, setMounted] = useState<boolean>(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const onClose = () => {
    setMounted(false)
    // close()
    setTimeout(() => {
      close()
    }, 400)
  }
  return (
    <Transition mounted={mounted} transition="fade" duration={400} timingFunction="ease" {...props}>
      {(styles) => (
        <div style={{ padding: 4, width: 200, ...styles }} onClick={onClose}>
          <Stack spacing="xs">
            <Button compact variant="subtle" color="gray">
              1
            </Button>
            <Button compact variant="subtle" color="gray">
              2
            </Button>
            <Button compact variant="subtle" color="gray">
              3
            </Button>
            {/* {children} */}
          </Stack>
        </div>
      )}
    </Transition>
  )
}

export default TransitionContextMenu
