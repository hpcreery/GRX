type MessageSender = (title: string, message: string) => Promise<void>

interface MessageHandler {
  setSender: (sender: MessageSender, title: string) => void
  setTitle: (title: string) => void
  add: (message: string) => void
  log: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  clear: () => void
  get: () => string[]
}

function useMessageHandler(): MessageHandler {
  let sender: MessageSender | undefined
  let title: string | undefined
  let messages: string[] = []
  function setSender(newSender: MessageSender, newTitle: string): void {
    sender = newSender
    title = newTitle
  }
  function setTitle(newTitle: string): void {
    title = newTitle
  }
  function add(message: string): void {
    if (sender && title) {
      sender(title, message)
    }
    console.log(`[${title}] ${message}`)
    messages.push(message)
  }
  function log(message: string): void {
    add(message)
  }
  function warn(message: string): void {
    add(`[WARN] ${message}`)
  }
  function error(message: string): void {
    add(`[ERROR] ${message}`)
  }
  function clear(): void {
    messages = []
  }
  function get(): string[] {
    return messages
  }
  return {
    setSender,
    setTitle,
    add,
    log,
    warn,
    error,
    clear,
    get
  }
}

const messages = useMessageHandler()

export default messages