import { Badge } from "@/components/ui/badge"

interface UnreadBadgeProps {
  count: number
  className?: string
}

export function UnreadBadge({ count, className = "" }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <Badge 
      className={`bg-red-500 hover:bg-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full ${className}`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  )
}
