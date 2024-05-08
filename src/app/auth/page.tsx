// signin via next-auth
import { LoginForm } from "./LoginForm";

export default function AuthPage() {
  return (
    <div>
      <div>AuthPage</div>
      <LoginForm mode="login" />
      <LoginForm mode="signup" />
    </div>
  );
}
