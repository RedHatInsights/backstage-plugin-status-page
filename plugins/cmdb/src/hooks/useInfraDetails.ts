import { useApi } from '@backstage/core-plugin-api';
import { InfraDetails, serviceNowApiRef } from '../apis';
import { useState, useEffect } from 'react';

export function useInfraDetails(appCode: string): {
  loading: boolean;
  infraDetails: InfraDetails[];
} {
  const serviceNowApi = useApi(serviceNowApiRef);

  const [infraDetails, setInfraDetails] = useState<InfraDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    serviceNowApi.getInfraDetails(appCode).then(response => {
      setInfraDetails(response.result);
      setLoading(false);
    });
  }, [serviceNowApi, appCode]);

  return { loading, infraDetails };
}
