import React, { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  EmptyState,
  InfoCard,
  InfoCardVariants,
} from '@backstage/core-components';
import { IconButton } from '@material-ui/core';
import Cached from '@material-ui/icons/Cached';
import { ServiceDetailsContent } from './ServiceDetailsContent';
import { getAppCodeFromEntity } from '../../utils/getAppCodeFromEntity';
import { useServiceDetails } from '../../hooks';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { getServiceNowDashboardUrl } from '../../utils/getServiceNowDashboardUrl';
import { CardSkeleton } from '../CardSkeleton';
import { useServiceUser } from '../../hooks/useServiceUser';
import { iff } from '../../utils/ternaryConditional';

export interface Props {
  variant?: InfoCardVariants;
}

export const ServiceDetailsCard = (props: Props) => {
  const { entity } = useEntity();
  const configApi = useApi(configApiRef);

  const { loading, serviceDetails } = useServiceDetails(
    getAppCodeFromEntity(entity),
  );

  const { userInfo: owner } = useServiceUser(serviceDetails?.owned_by?.value);
  const { userInfo: delegate } = useServiceUser(
    serviceDetails?.u_delegate?.value,
  );

  const serviceDashboardUrl = useMemo(() => {
    const serviceNowHost = configApi.getString('cmdb.host');
    return getServiceNowDashboardUrl(serviceNowHost, serviceDetails?.sys_id);
  }, [configApi, serviceDetails?.sys_id]);

  return (
    <InfoCard
      title="CMDB Details"
      variant={props.variant}
      deepLink={{
        link: serviceDashboardUrl,
        title: 'View on Service Now',
      }}
    >
      {loading ? (
        <CardSkeleton />
      ) : (
        iff(
          !serviceDetails || Object.keys(serviceDetails).length === 0,
          <EmptyState
            missing="field"
            title="Application not found"
            description="Looks like the appcode might be incorrect!"
          />,
          <ServiceDetailsContent
            details={serviceDetails}
            owner={owner}
            delegate={delegate}
          />,
        )
      )}
    </InfoCard>
  );
};
