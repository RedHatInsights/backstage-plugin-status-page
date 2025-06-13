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
  const serviceAccounts = statistics.service_accounts;

  // Total user accounts (before)
  const totalUserAccountsBefore = rover.fresh + gitlab.fresh;
  // Total service accounts (before)
  const totalServiceAccountsBefore = serviceAccounts.fresh;
  // Total access reviews (before) = user accounts + service accounts
  const totalAccessReviewsBefore =
    totalUserAccountsBefore + totalServiceAccountsBefore;

  // Total user accounts (after)
  const totalUserAccountsAfter = rover.total + gitlab.total;
  // Total service accounts (after)
  const totalServiceAccountsAfter = serviceAccounts.total;
  // Total access reviews (after)
  const totalAccessReviewsAfter =
    totalUserAccountsAfter + totalServiceAccountsAfter;

  // Calculate approved and rejected totals
  const totalApprovedBefore =
    rover.approved + gitlab.approved + serviceAccounts.approved;
  const totalRejectedBefore =
    rover.rejected + gitlab.rejected + serviceAccounts.rejected;
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
    serviceAccounts: {
      before: serviceAccounts.fresh,
      after: serviceAccounts.total,
      approved: serviceAccounts.approved,
      rejected: serviceAccounts.rejected,
    },
    validationResult,
  };
};

export const getChangeClass = (change: number, classes: any) => {
  if (change > 0) return classes.positiveChange;
  if (change < 0) return classes.negativeChange;
  return classes.neutralChange;
};
