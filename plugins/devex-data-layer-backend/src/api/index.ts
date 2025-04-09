export const getSearchId = async (
  splunkApiHost: string,
  token: string,
  query: string,
  forSubgraphName: boolean = false,
  errorRate: boolean = false,
) => {
  let searchParams: any = {
    search: query,
    latest_time: 'now',
    preview: 'true',
    output_mode: 'json',
    count: '0',
  };
  if (!forSubgraphName) {
    searchParams = { ...searchParams, earliest_time: '-6mon' };
  } else if (errorRate) {
    searchParams = { ...searchParams, earliest_time: '-30d' };
  }
  return await fetch(`${splunkApiHost}/services/search/jobs`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams(searchParams).toString(),
  })
    .then(response => response.json())
    .then(response => {
      if (response && response.sid) return { sid: response.sid };
      return null;
    })
    .catch(_err => {
      return null;
    });
};

export const getSearchStatus = async (
  splunkApiHost: string,
  token: string,
  searchId: string,
) => {
  return await fetch(
    `${splunkApiHost}/services/search/jobs/${searchId}?output_mode=json&count=0`,
    {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )
    .then(response => response.json())
    .then(response => {
      if (response) return response;
      return null;
    })
    .catch(_err => {
      return null;
    });
};

export const getResultsWithSearchId = async (
  splunkApiHost: string,
  token: string,
  searchId: string,
) => {
  return await fetch(
    `${splunkApiHost}/services/search/jobs/${searchId}/results_preview?output_mode=json&count=0`,
    {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )
    .then(response => response.json())
    .then(response => {
      if (response) return response;
      return null;
    })
    .catch(_err => {
      return null;
    });
};

export const getSubgraphs = async (snippetUrl: string) => {
  return await fetch(`${snippetUrl}`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(response => {
      if (response) return response;
      return null;
    })
    .catch(_err => {
      return null;
    });
};
