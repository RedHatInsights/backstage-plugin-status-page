import React from 'react';
import { AutocompletePicker } from './AutocompletePicker';
import { WorkstreamLeadFilter } from './filters';

export const WorkstreamLeadPicker = () => {
  return (
    <AutocompletePicker
      name="lead"
      label="Lead"
      path="spec.lead"
      Filter={WorkstreamLeadFilter}
      isEntityRef
    />
  );
};
