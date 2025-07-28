import { StatisticsData } from './types';

export const calculateChange = (before: number, after: number): number => {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
};

export const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

export const calculateTotals = (statistics: StatisticsData) => {
  const rover = statistics.group_access.rover;
  const gitlab = statistics.group_access.gitlab;
  const ldap = statistics.group_access.ldap;
  const roverServiceAccounts = statistics.service_accounts.rover;
  const gitlabServiceAccounts = statistics.service_accounts.gitlab;
  const ldapServiceAccounts = statistics.service_accounts.ldap;

  // Total user accounts (before) - group access from all sources
  const totalUserAccountsBefore = rover.fresh + gitlab.fresh + ldap.fresh;
  // Total service accounts (before) - service accounts from all sources
  const totalServiceAccountsBefore =
    roverServiceAccounts.fresh +
    gitlabServiceAccounts.fresh +
    ldapServiceAccounts.fresh;
  // Total access reviews (before) = user accounts + service accounts
  const totalAccessReviewsBefore =
    totalUserAccountsBefore + totalServiceAccountsBefore;

  // Total user accounts (after) - group access from all sources
  const totalUserAccountsAfter = rover.total + gitlab.total + ldap.total;
  // Total service accounts (after) - service accounts from all sources
  const totalServiceAccountsAfter =
    roverServiceAccounts.total +
    gitlabServiceAccounts.total +
    ldapServiceAccounts.total;
  // Total access reviews (after)
  const totalAccessReviewsAfter =
    totalUserAccountsAfter + totalServiceAccountsAfter;

  // Calculate approved and rejected totals
  const totalApprovedBefore =
    rover.approved +
    gitlab.approved +
    ldap.approved +
    roverServiceAccounts.approved +
    gitlabServiceAccounts.approved +
    ldapServiceAccounts.approved;
  const totalRejectedBefore =
    rover.rejected +
    gitlab.rejected +
    ldap.rejected +
    roverServiceAccounts.rejected +
    gitlabServiceAccounts.rejected +
    ldapServiceAccounts.rejected;
  const totalBefore = totalApprovedBefore + totalRejectedBefore;

  // Validate data consistency
  const validationResult = {
    isValid: totalBefore === totalAccessReviewsBefore,
    totalBefore,
    totalAccessReviewsBefore,
    difference: totalBefore - totalAccessReviewsBefore,
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
      before: rover.fresh,
      after: rover.total,
      approved: rover.approved,
      rejected: rover.rejected,
    },
    gitlab: {
      before: gitlab.fresh,
      after: gitlab.total,
      approved: gitlab.approved,
      rejected: gitlab.rejected,
    },
    ldap: {
      before: ldap.fresh,
      after: ldap.total,
      approved: ldap.approved,
      rejected: ldap.rejected,
    },
    serviceAccounts: {
      before: totalServiceAccountsBefore,
      after: totalServiceAccountsAfter,
      approved:
        roverServiceAccounts.approved +
        gitlabServiceAccounts.approved +
        ldapServiceAccounts.approved,
      rejected:
        roverServiceAccounts.rejected +
        gitlabServiceAccounts.rejected +
        ldapServiceAccounts.rejected,
    },
    validationResult,
  };
};

export const getChangeClass = (change: number, classes: any) => {
  if (change > 0) return classes.positiveChange;
  if (change < 0) return classes.negativeChange;
  return classes.neutralChange;
};
