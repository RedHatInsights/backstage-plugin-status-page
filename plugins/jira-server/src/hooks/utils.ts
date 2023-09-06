import { AxiosError } from 'axios';

export const handleError = (error: AxiosError<{ errorMessages: string[] }>) =>
  Promise.reject({
    message:
      (error?.response?.data?.errorMessages &&
        error.response.data.errorMessages[0].toString()) ||
      error?.message ||
      error?.request ||
      error.toString(),
  });
