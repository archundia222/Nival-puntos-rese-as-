// This policy runs on the server. A public registration never grants this role.
export const administratorEmail = 'rodrigoarchundia379@gmail.com';
export function isAdministratorIdentity(user) {
  return Boolean(user?.id && user.emailVerified === true &&
    typeof user.email === 'string' &&
    user.email.trim().toLowerCase() === administratorEmail);
}
export function canEnterAdministration(user, profile) {
  return isAdministratorIdentity(user) && profile?.id === user.id &&
    profile.role === 'superadmin';
}
