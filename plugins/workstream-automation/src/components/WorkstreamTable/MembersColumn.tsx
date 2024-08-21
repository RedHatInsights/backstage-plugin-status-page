import { Member } from '../../types';
import { UserEntity } from '@backstage/catalog-model';
import { ProfileInfo, useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import Skeleton from '@material-ui/lab/Skeleton';
import AvatarGroup from '@material-ui/lab/AvatarGroup';
import React, { useEffect, useState } from 'react';

const useStyles = makeStyles(theme => ({
  root: {
    fontSize: 'medium',
    backgroundColor: theme.palette.textSubtle,
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  skeleton: {
    width: '70%',
  },
}));

export const MembersColumn = (props: { members: Member[] }) => {
  const { members } = props;
  const memberUserRefs = members.map(m => m.userRef);
  const catalogApi = useApi(catalogApiRef);
  const [userProfiles, setUserProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const classes = useStyles();

  useEffect(() => {
    if (loading) {
      catalogApi
        .getEntitiesByRefs({
          entityRefs: memberUserRefs,
          filter: [{ kind: 'User' }],
          fields: ['spec.profile'],
        })
        .then(res => {
          if (res.items.length > 0) {
            setUserProfiles(
              (res.items as UserEntity[]).map(entity => ({
                displayName: entity.spec.profile?.displayName,
                email: entity.spec.profile?.email,
                picture: entity.spec.profile?.picture,
              })),
            );
          }
          setLoading(false);
        });
    }
  }, [loading, catalogApi, memberUserRefs]);

  return !loading ? (
    <AvatarGroup classes={{ avatar: classes.root }} spacing={6} max={3}>
      {userProfiles.length > 0 ? (
        userProfiles.map(profile => (
          <Tooltip key={profile.displayName} title={profile.displayName ?? ''}>
            <Avatar
              key={profile.displayName}
              alt={profile.displayName}
              src={profile.picture}
            >
              {profile.displayName?.at(0)}
            </Avatar>
          </Tooltip>
        ))
      ) : (
        <>-</>
      )}
    </AvatarGroup>
  ) : (
    <Box className={classes.skeleton}>
      <Skeleton variant="rect" animation="wave" />
    </Box>
  );
};
