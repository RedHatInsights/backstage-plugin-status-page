import { AutocompletePicker } from './AutocompletePicker';
import { WorkstreamPortfolioFilter } from './filters';

export const WorkstreamPortfolioPicker = () => {
  return (
    <AutocompletePicker
      Filter={WorkstreamPortfolioFilter}
      label="Portfolio"
      isEntityRef
      name="portfolio"
      path="spec.portfolio"
      showCounts
    />
  );
};
