import { useApi } from '@backstage/core-plugin-api';
import { BusinessApplication, serviceNowApiRef } from '../apis';
import { useEffect, useState } from 'react';

const emptyServiceDetails = {} as BusinessApplication;

/** @public */
export function useServiceDetails(appCode: string) {
  const serviceNowApi = useApi(serviceNowApiRef);
  const [serviceDetails, setServiceDetails] =
    useState<BusinessApplication>(emptyServiceDetails);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    serviceNowApi.getBusinessApplication(appCode).then(response => {
      setServiceDetails(response.result[0]);
      setLoading(false);
    });
  }, [serviceNowApi, appCode]);

  return { loading, serviceDetails };
}
