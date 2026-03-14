import { SignIn } from "@clerk/clerk-react";

export default function SignInPage(props: { path: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <SignIn
          path={props.path}
          routing="path"
          signUpUrl="/sign-up"             // Link to SignUp page
         // redirectUrl="/dashboard"         // Redirect after successful login
        />
      </div>
    </div>
  );
}