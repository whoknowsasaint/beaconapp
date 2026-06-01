"use client"

import { useState } from "react"
import Modal from "./Modal"
import Button from "./Button"

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title       = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  variant      = "danger",
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-2 justify-end mt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant={variant}
          size="sm"
          loading={loading}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}