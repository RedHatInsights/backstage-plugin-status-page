import { CustomUserEntity } from '../types';

export function getWorkstreamsRelations(user: CustomUserEntity) {
  return (
    user.relations?.filter(
      p => p.targetRef.startsWith('workstream') && p.type !== 'memberOf',
    ) ?? []
  );
}
