export const rolesMap: { [key: string]: string } = {
  'technical-lead': 'Technical Lead',
  'software-engineer': 'Software Engineer',
  'quality-engineer': 'Quality Engineer',
};

export function getRoleFromRelation(
  role: string,
  customRolesMap?: { [key: string]: string },
) {
  const _rolesMap = { ...rolesMap, ...customRolesMap };
  return _rolesMap[role] ?? '-';
}
