import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { ServiceNowUser, serviceNowApiRef } from '../apis';

/** @public */
export function useServiceUser(userId: string) {
  const serviceNowApi = useApi(serviceNowApiRef);
  const [userInfo, setUserInfo] = useState<ServiceNowUser>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      return;
    }

    setLoading(true);

    serviceNowApi.getUserDetails(userId).then(response => {
      setUserInfo(response.result);
      setLoading(false);
    });
  }, [serviceNowApi, userId]);

  return { loading, userInfo };
}
