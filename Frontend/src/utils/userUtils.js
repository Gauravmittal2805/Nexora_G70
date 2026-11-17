/**
 * Helper utility to extract clean, friendly first names from user objects
 */
export const getFirstName = (user) => {
  if (!user) return 'Developer';

  // If user has a name field
  if (user.name && typeof user.name === 'string') {
    const trimmed = user.name.trim();

    // If name is an email like "user@domain.com"
    if (trimmed.includes('@')) {
      const local = trimmed.split('@')[0];
      const part = local.split(/[._-]/)[0];
      return part.charAt(0).toUpperCase() + part.slice(1);
    }

    // Extract first word of the name
    const first = trimmed.split(/\s+/)[0];
    // If the first word has dots/hyphens like "alex.developer", pick the first segment
    const cleanFirst = first.split(/[._-]/)[0];
    return cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1);
  }

  // If only email is present
  if (user.email && typeof user.email === 'string') {
    const local = user.email.split('@')[0];
    const part = local.split(/[._-]/)[0];
    return part.charAt(0).toUpperCase() + part.slice(1);
  }

  return 'Developer';
};
