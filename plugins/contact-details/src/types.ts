import { Entity } from '@backstage/catalog-model';

export interface EntityWithContacts extends Entity {
  spec: {
    contacts?: Array<{ label: string } & UsersContact & GroupContact>;
  };
}

type UsersContact = {
  users?: string[];
};
type GroupContact = {
  group?: string;
};
