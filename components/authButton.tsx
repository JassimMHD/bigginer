import type { ButtonHTMLAttributes } from 'react'

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export default function AuthButton({
  className = '',
  type = 'button',
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      className={`auth-btn ${className}`}
      {...props}
    />
  )
}
