import { Link } from 'react-router-dom'

interface ErrorMessageProps {
  message: string
  secondaryMessage?: string
  showBackLink?: boolean
}

export default function ErrorMessage({
  message,
  secondaryMessage,
  showBackLink = true,
}: ErrorMessageProps) {
  return (
    <div className="py-10 text-center">
      <p data-testid="error-message" className="mb-4 text-destructive">
        {message}
      </p>
      {secondaryMessage && <p className="mb-4 text-sm text-muted-foreground">{secondaryMessage}</p>}
      {showBackLink && (
        <Link
          to="/"
          data-testid="back-to-list-link"
          className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          返回场景列表
        </Link>
      )}
    </div>
  )
}