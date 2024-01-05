import { useApi } from '@backstage/core-plugin-api';
import { InfraDetails, serviceNowApiRef } from '../apis';
import React from 'react';

export function useInfraDetails(appCode: string): {
  loading: boolean;
  infraDetails: InfraDetails[];
} {
  const serviceNowApi = useApi(serviceNowApiRef);

  const [infraDetails, setInfraDetails] = React.useState<InfraDetails[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);

    serviceNowApi.getInfraDetails(appCode).then(response => {
      setInfraDetails(response.result);
      setLoading(false);
    });
  }, [serviceNowApi, appCode]);

  return { loading, infraDetails };
}
