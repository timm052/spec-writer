export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
        <p className="text-gray-600">
          A sign-in link has been sent to your email address. The link expires in 24 hours.
        </p>
      </div>
    </div>
  );
}
