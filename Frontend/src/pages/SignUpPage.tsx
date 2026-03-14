import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage(props: { path: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <SignUp
          path={props.path}
          routing="path"
          signInUrl="/sign-in"            // Link back to SignIn page
          redirectUrl="/dashboard"        // Redirect after successful registration
        />
      </div>
    </div>
  );
}
