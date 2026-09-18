/**
 * The shared demo account on the hosted deployment.
 *
 * These credentials are deliberately public - they're printed on the sign-in
 * page so anyone can look around a populated library without registering. The
 * account is read-mostly: the API refuses to change its password (see
 * UserService), so one visitor can't lock everyone else out.
 */
export const DEMO_EMAIL = "demo@google-photos-clone.app";
export const DEMO_PASSWORD = "DemoPass123!";

/**
 * Only offered where the demo account actually exists. A developer pointing at
 * their own backend gets their own empty database, so the hint would be a lie.
 */
export function demoAccountAvailable() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
  return !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(apiUrl);
}
