import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#081636]">403</h1>
        <p className="mt-2 text-lg text-[#081636]">Unauthorized Access</p>
        <p className="mt-1 text-sm text-[#081636]">
          You don't have permission to access this resource.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
