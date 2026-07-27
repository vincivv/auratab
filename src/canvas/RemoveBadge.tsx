interface RemoveBadgeProps {
  onRemove: () => void
}

/** FR-3: remove control shown on every widget while in edit mode. */
export function RemoveBadge({ onRemove }: RemoveBadgeProps) {
  return (
    <button
      type="button"
      className="remove-badge"
      aria-label="Remove widget"
      // Same bubbling issue as the resize handle — must not reach the box's drag binding.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
    >
      ×
    </button>
  )
}
