import React from 'react';
import { AutocompletePicker } from './AutocompletePicker';
import { WorkstreamPillarFilter } from './filters';

export const WorkstreamPillarPicker = () => {
  return (
    <AutocompletePicker
      Filter={WorkstreamPillarFilter}
      label="Pillar"
      name="pillar"
      path="spec.pillar"
    />
  );
};
