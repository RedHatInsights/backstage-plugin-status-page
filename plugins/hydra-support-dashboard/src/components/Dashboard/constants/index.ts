export {
  type IProgressData,
  type ISankeyData,
  type ITableData,
  type ICMDBResult,
  type IEpics,
  type IJiraCustomFields,
  type IHlgDetail,
  type IEpicConfig,
} from './Interfaces';

export const RedHatStandardColors = [
  '#f5921b', // orange
  '#ee0000', // redhat-red
  '#37a3a3', // teal
  '#5e40be', // purple
  '#204d00', // green
  '#0066cc', // blue
  '#f0561d', // danger-red
  '#63993d', // green
  '#ce8873', // cool-tone-brown
  '#dca614', // yellow-40
  '#876fd4', // purple-40
  '#9ad8d8', // teal-30
];

export const ChartTimePeriods = [
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

export const MonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export { getLocaleNumberString } from './Utilities';
