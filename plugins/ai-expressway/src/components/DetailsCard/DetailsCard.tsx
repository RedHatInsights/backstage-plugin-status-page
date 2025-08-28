import { EmptyState, InfoCard, Link } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { IconButton } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

import { DetailsContent } from './DetailsContent';

/**
 * Interface for XE AI Expressway metadata structure
 */
interface XeaiwayMetadata {
  id?: string;
  summary?: string;
  phase?: string;
  status?: string;
  owner?: string;
  ownerEmail?: string;
  assignee?: string;
  tags?: string[];
}

/**
 * DetailsCard Component
 * 
 * Displays XE AI Expressway initiative information in a card format.
 * The component reads enriched metadata from the entity and renders
 * it in a user-friendly interface.
 */
export const DetailsCard = () => {
  const { entity } = useEntity();

  // Extract XE AI Expressway metadata from entity
  const xeaiwayData = (entity.metadata as any)?.xeaixway as XeaiwayMetadata | undefined;

  // Generate JIRA URL if issue ID is available
  const jiraUrl = xeaiwayData?.id 
    ? `https://issues.redhat.com/browse/${xeaiwayData.id}` 
    : undefined;

  // Create title with optional JIRA link
  const titleWithIcon = (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      width: '100%' 
    }}>
      <span>XE AI Expressway</span>
      {jiraUrl && (
        <Link to={jiraUrl} target="_blank" rel="noopener">
          <IconButton 
            aria-label="Open in JIRA" 
            size="small"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Link>
      )}
    </div>
  );

  return (
    <InfoCard title={titleWithIcon}>
      {!xeaiwayData ? (
        <EmptyState
          title="XE AI Expressway data not found"
          missing="info"
          description="This entity does not have XE AI Expressway initiative data. Expected annotation 'xeaixway/initiative' to be present."
        />
      ) : (
        <DetailsContent
          id={xeaiwayData.id}
          summary={xeaiwayData.summary}
          phase={xeaiwayData.phase}
          status={xeaiwayData.status}
          tags={xeaiwayData.tags}
          ownerName={xeaiwayData.owner}
          ownerEmail={xeaiwayData.ownerEmail}
          assignee={xeaiwayData.assignee}
          namespace={entity.metadata.namespace}
        />
      )}
    </InfoCard>
  );
};

