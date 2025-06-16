import {
  parseEntityRef,
  RELATION_MEMBER_OF,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import { CustomUserEntity } from '../types';

export function getWorkstreamsRelations(user: CustomUserEntity) {
  return (
    user.relations?.filter(
      p =>
        parseEntityRef(p.targetRef).kind.match(/workstream|art/g) &&
        p.type !== RELATION_MEMBER_OF &&
        p.type !== RELATION_OWNER_OF,
    ) ?? []
  );
}
