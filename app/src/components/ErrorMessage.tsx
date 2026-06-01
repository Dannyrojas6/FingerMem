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
    <div className="text-center py-10">
      <p data-testid="error-message" className="text-red-500 mb-4">{message}</p>
      {secondaryMessage && <p className="text-gray-500 mb-4 text-sm">{secondaryMessage}</p>}
      {showBackLink && (
        <Link to="/" data-testid="back-to-list-link" className="text-blue-600 hover:underline">
          返回场景列表
        </Link>
      )}
    </div>
  )
}
