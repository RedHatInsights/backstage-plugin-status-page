import {
  InfoCard,
  InfoCardVariants,
  Progress,
} from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { AccordionField } from './AccordionField';
import { useEntity } from '@backstage/plugin-catalog-react';
import { EntityWithContacts } from '../types';
import { getContactsFromEntity } from '../utils/getContactsFromEntity';

export interface ContactDetailsCardProps {
  variant?: InfoCardVariants;
}

export const ContactDetailsCard = (props: ContactDetailsCardProps) => {
  const { entity } = useEntity<EntityWithContacts>();

  const contacts = getContactsFromEntity(entity);

  if (!entity) {
    return <Progress />;
  }

  return (
    <InfoCard title="Contact Details" variant={props.variant} noPadding>
      <Grid>
        {contacts.map(({ label, users, group }, index) => (
          <AccordionField
            key={index}
            variant={group ? 'group' : 'user'}
            label={label}
            value={group}
            values={users}
          />
        ))}
      </Grid>
    </InfoCard>
  );
};
