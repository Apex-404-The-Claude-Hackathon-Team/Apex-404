type ToastType = 'error' | 'success' | 'warning'

interface Toast {
  message: string
  type: ToastType
  visible: boolean
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToast = () => {
  const toast = useState<Toast>('global-toast', () => ({
    message: '',
    type: 'error',
    visible: false
  }))

  const show = (message: string, type: ToastType = 'error', duration = 5000) => {
    if (timer) clearTimeout(timer)
    toast.value = { message, type, visible: true }
    timer = setTimeout(() => { toast.value.visible = false }, duration)
  }

  const hide = () => {
    if (timer) clearTimeout(timer)
    toast.value.visible = false
  }

  return { toast, show, hide }
}
