import { Entity } from '@backstage/catalog-model';
import Chip from '@material-ui/core/Chip';
import ExpandLess from '@material-ui/icons/ExpandLess';
import { useState } from 'react';

export const Tags = (props: { entity: Entity }) => {
  const { entity } = props;
  const tags = entity.metadata.tags || [];
  const [showAllTags, setShowAllTags] = useState(false);

  const handleToggle = () => setShowAllTags(!showAllTags);
  const visibleTags = showAllTags ? tags : tags.slice(0, 2);
  const remainingTagsCount = tags.length - visibleTags.length;

  if (tags.length === 0) return <>-</>;

  return (
    <>
      {visibleTags.map(t => (
        <Chip
          key={t}
          label={t}
          size="small"
          variant="outlined"
          style={{ marginBottom: '0px' }}
        />
      ))}
      {!showAllTags && remainingTagsCount === 0 ? null : (
        <Chip
          label={
            remainingTagsCount > 0 ? `+${remainingTagsCount} more` : 'Show Less'
          }
          icon={remainingTagsCount > 0 ? undefined : <ExpandLess />}
          size="small"
          variant="outlined"
          clickable
          style={{ marginBottom: '0px' }}
          onClick={handleToggle}
        />
      )}
    </>
  );
};
