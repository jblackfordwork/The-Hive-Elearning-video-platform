export function normalizeClassName(value) {
  return String(value || '').trim();
}

export function getClassOptions(users = []) {
  const options = new Set();
  let hasUnassigned = false;

  users.forEach((user) => {
    const className = normalizeClassName(user.className);
    if (className) options.add(className);
    else hasUnassigned = true;
  });

  return [
    ...(hasUnassigned ? [''] : []),
    ...[...options].sort((a, b) => a.localeCompare(b)),
  ];
}

export function userMatchesClass(user, classFilter) {
  if (!classFilter || classFilter === 'all') return true;
  return normalizeClassName(user?.className) === classFilter;
}
