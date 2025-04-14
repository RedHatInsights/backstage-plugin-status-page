export const MatomoPeriods = [
  {
    title: 'Past 30 Days',
    period: 'week',
    range: 'last4',
  },
  {
    title: 'Past 3 Months',
    period: 'month',
    range: 'last3',
  },
  {
    title: 'Past 6 Months',
    period: 'month',
    range: 'last6',
  },
  {
    title: 'Past Year',
    period: 'month',
    range: 'last12',
  },
];

export const SplunkTimePeriods = [
  {
    title: 'Past 6 Months',
    id: '180',
  },
  {
    title: 'Past 3 Months',
    id: '90',
  },
  {
    title: 'Past 60 days',
    id: '60',
  },
  {
    title: 'Past 30 days',
    id: '30',
  },
  {
    title: 'Past 7 days',
    id: '7',
  },
];

export enum AccessTypes {
  Internal = 'Internal',
  Public = 'Public',
}

export const RedHatStandardColors = [
  '#f5921b', // orange
  '#ee0000', // redhat-red
  '#37a3a3', // teal
  '#5e40be', // purple
  '#ffcc17', // yellow
  '#0066cc', // blue
  '#f0561d', // danger-red
  '#63993d', // green
  '#ce8873', // cool-tone-brown
];

export const RedHatBlueOrangeShades = [
  '#ca6c0f', // orange-50
  '#92c5f9', // blue-30
  '#f8ae54', // orange-30
  '#0066cc', // blue-50
];

export const RedHatErrorRedShades = [
  '#a60000', // red-60
  '#ee0000', // red-50
  '#f56e6e', // red-40
  '#f9a8a8', // red-30
  '#fbc5c5', // red-20
  '#fce3e3', // red-10
];
