'use client'

type StoryPreviewCardProps = {
  title: string | null
  content: string
}

export default function StoryPreviewCard({ title, content }: StoryPreviewCardProps) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      {title ? <h3 className="mb-2 font-semibold text-gray-900">{title}</h3> : null}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p>
    </div>
  )
}
