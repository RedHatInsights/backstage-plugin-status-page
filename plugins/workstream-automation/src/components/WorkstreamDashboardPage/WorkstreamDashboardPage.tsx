import { Header, Page } from '@backstage/core-components';

import { Button } from '@material-ui/core';
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace';
import { useNavigate } from 'react-router-dom';
import { WorkstreamDashboardContent } from './WorkstreamDashboardContent';

export const WorkstreamDashboardPage = () => {
  const navigate = useNavigate();
  const canGoBack = window.history.state && window.history.state.idx > 0;

  const handleBackClick = () => {
    if (canGoBack) {
      navigate(-1); // Go back if possible
    } else {
      navigate('/catalog?filters[kind]=workstream'); // Fallback if user opened URL directly
    }
  };

  return (
    <Page themeId="tool">
      <Header
        title="Workstream Dashboard"
        subtitle="Overview of all active workstreams, ARTs, and contributor insights."
      >
        <Button
          variant="outlined"
          onClick={handleBackClick}
          style={{ marginRight: '24px' }}
        >
          {canGoBack ? (
            <>
              <KeyboardBackspaceIcon style={{ marginRight: '4px' }} />
              Go Back
            </>
          ) : (
            <>
              Goto Catalog
              <KeyboardBackspaceIcon
                style={{ marginLeft: '4px', rotate: '180deg' }}
              />
            </>
          )}
        </Button>
      </Header>
      <WorkstreamDashboardContent />
    </Page>
  );
};
