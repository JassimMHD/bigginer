import { redirect } from 'next/navigation'

export default function Home() {
  // Unauthenticated visitors are bounced to /login by middleware once they
  // follow this redirect to a gated route.
  redirect('/dashboard')
}
