import { ArtEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { ARTForm1 } from '../../CreateArtModal/types';

export type Form = ARTForm1 & {
  artPath?: string;
};

export type EditDialogProps = {
  entity: ArtEntity;
  open: boolean;
  editModalCloseFn: Function;
};
