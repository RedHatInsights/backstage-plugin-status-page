import { AutocompletePicker } from './AutocompletePicker';
import { WorkstreamTechLeadFilter } from './filters';

export const WorkstreamTechLeadPicker = () => {
  return (
    <AutocompletePicker
      Filter={WorkstreamTechLeadFilter}
      label="Technical Lead"
      name="technical-lead"
      path="relations.technical-lead"
      isEntityRef
      showCounts
    />
  );
};
