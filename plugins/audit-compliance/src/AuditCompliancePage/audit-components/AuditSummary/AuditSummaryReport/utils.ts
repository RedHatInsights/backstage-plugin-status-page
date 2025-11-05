import { StatisticsData } from './types';

export const calculateChange = (before: number, after: number): number => {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
};

export const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Helper function to sum a numeric property across sources
const sumProperty = (
  sources: Array<{ [key: string]: any }>,
  property: string,
): number => {
  return sources.reduce(
    (total, source) => total + (Number(source[property]) || 0),
    0,
  );
};

export const calculateTotals = (statistics: StatisticsData) => {
  const rover = statistics.group_access.rover;
  const gitlab = statistics.group_access.gitlab;
  const ldap = statistics.group_access.ldap;
  const manual = statistics.group_access.manual || {
    total: 0,
    fresh: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    changes: { added: 0, removed: 0, modified: 0 },
  };
  const roverServiceAccounts = statistics.service_accounts.rover;
  const gitlabServiceAccounts = statistics.service_accounts.gitlab;
  const ldapServiceAccounts = statistics.service_accounts.ldap;
  const manualServiceAccounts = statistics.service_accounts.manual || {
    total: 0,
    fresh: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    changes: { added: 0, removed: 0, modified: 0 },
  };

  // Group sources for easier iteration
  const userAccountSources = [rover, gitlab, ldap, manual];
  const serviceAccountSources = [
    roverServiceAccounts,
    gitlabServiceAccounts,
    ldapServiceAccounts,
    manualServiceAccounts,
  ];

  // Calculate totals using helper function
  // totalBefore = from regular tables (group_access_reports + service_account_access_review)
  // totalAfter = from fresh tables (group_access_reports_fresh + service_account_access_review_fresh)
  const totalUserAccountsBefore = sumProperty(userAccountSources, 'total');
  const totalUserAccountsAfter = sumProperty(userAccountSources, 'fresh');
  const totalServiceAccountsBefore = sumProperty(
    serviceAccountSources,
    'total',
  );
  const totalServiceAccountsAfter = sumProperty(serviceAccountSources, 'fresh');

  const totalAccessReviewsBefore =
    totalUserAccountsBefore + totalServiceAccountsBefore;
  const totalAccessReviewsAfter =
    totalUserAccountsAfter + totalServiceAccountsAfter;

  // Calculate rejected totals
  const totalRejectedBefore =
    rover.rejected +
    gitlab.rejected +
    ldap.rejected +
    manual.rejected +
    roverServiceAccounts.rejected +
    gitlabServiceAccounts.rejected +
    ldapServiceAccounts.rejected +
    manualServiceAccounts.rejected;

  // Validate data consistency
  // Logic: total (before/fresh) - rejections should equal total (after refresh summary)
  const expectedTotalAfter = totalAccessReviewsBefore - totalRejectedBefore;

  // Calculate service account rejected details
  const serviceAccountsRejected =
    roverServiceAccounts.rejected +
    gitlabServiceAccounts.rejected +
    ldapServiceAccounts.rejected +
    manualServiceAccounts.rejected;

  // Calculate user account rejected details
  const userAccountsRejected =
    rover.rejected + gitlab.rejected + ldap.rejected + manual.rejected;

  const validationResult = {
    isValid: expectedTotalAfter === totalAccessReviewsAfter,
    totalBefore: totalAccessReviewsBefore,
    totalAfter: totalAccessReviewsAfter,
    totalRejectedBefore,
    expectedTotalAfter,
    difference: totalAccessReviewsAfter - expectedTotalAfter,
    serviceAccountsRejected,
    userAccountsRejected,
    serviceAccountsAfter: totalServiceAccountsAfter,
    serviceAccountsBefore: totalServiceAccountsBefore,
  };

  return {
    totalUserAccounts: {
      before: totalUserAccountsBefore,
      after: totalUserAccountsAfter,
      change: calculateChange(totalUserAccountsBefore, totalUserAccountsAfter),
    },
    totalServiceAccounts: {
      before: totalServiceAccountsBefore,
      after: totalServiceAccountsAfter,
      change: calculateChange(
        totalServiceAccountsBefore,
        totalServiceAccountsAfter,
      ),
    },
    totalAccessReviews: {
      before: totalAccessReviewsBefore,
      after: totalAccessReviewsAfter,
      change: calculateChange(
        totalAccessReviewsBefore,
        totalAccessReviewsAfter,
      ),
    },
    rover: {
      before: rover.total,
      after: rover.fresh,
      approved: rover.approved,
      rejected: rover.rejected,
    },
    gitlab: {
      before: gitlab.total,
      after: gitlab.fresh,
      approved: gitlab.approved,
      rejected: gitlab.rejected,
    },
    ldap: {
      before: ldap.total,
      after: ldap.fresh,
      approved: ldap.approved,
      rejected: ldap.rejected,
    },
    manual: {
      before: manual.total + manualServiceAccounts.total,
      after: manual.fresh + manualServiceAccounts.fresh,
      approved: manual.approved + manualServiceAccounts.approved,
      rejected: manual.rejected + manualServiceAccounts.rejected,
    },
    serviceAccounts: {
      before: totalServiceAccountsBefore,
      after: totalServiceAccountsAfter,
      approved: sumProperty(serviceAccountSources, 'approved'),
      rejected: serviceAccountsRejected,
    },
    validationResult,
  };
};

export const getChangeClass = (change: number, classes: any) => {
  if (change > 0) return classes.positiveChange;
  if (change < 0) return classes.negativeChange;
  return classes.neutralChange;
};
