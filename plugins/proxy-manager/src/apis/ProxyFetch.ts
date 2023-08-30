import { toast } from 'react-toastify';

export const fetchAll = async (apiBaseUrl: string, accessToken: string) => {
  try {
    const res = await fetch(apiBaseUrl, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${accessToken}`, // notice the Bearer before your token
      },
    })
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then(err => {
            throw new Error(err?.message);
          });
      })
      .catch(error => {
        toast.error(error, {
          position: toast.POSITION.TOP_RIGHT,
        });
      });

    return res;
  } catch (err: any) {
    toast.error(err, {
      position: toast.POSITION.TOP_RIGHT,
    });
    return err;
  }
};
