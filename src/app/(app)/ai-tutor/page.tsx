import { TutorChat } from '@/components/ai/tutor-chat'

export default function AITutorPage() {
  return (
    <div className="mx-auto h-[calc(100vh-8rem)] max-w-4xl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">AI Tutor</h1>
        <p className="text-sm text-muted-foreground">
          Hỏi bất kỳ điều gì về ML, CV, Python, sklearn... AI sẽ giải thích theo trình độ của bạn.
        </p>
      </header>
      <TutorChat sessionId={null} context={{}} />
    </div>
  )
}
