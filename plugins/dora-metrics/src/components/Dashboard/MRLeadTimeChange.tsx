import { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Card, CardContent } from '@material-ui/core';

const chartSetting = {
  xAxis: [
    {
      label: 'Lead Time for change (Days)',
    },
  ],
  width: 700,
  height: 550,
  margin: { left: 50, right: 50, top: 10, bottom: 50 },
};

const valueFormatter = (value: any) => `${value}days`;

export function MRLeadTimeChangeChart({
  leadTimeChange,
}: {
  leadTimeChange: { mrCreatedOn: string; mrMergedOn: string; mrId: string }[];
}) {
  const [dataset, setDataset] = useState<
    { time: number; mrId: string; mrCreatedOn: string; mrMergedOn: string }[]
  >([]);

  useEffect(() => {
    if (leadTimeChange) {
      const newDataset: {
        time: number;
        mrId: string;
        mrCreatedOn: string;
        mrMergedOn: string;
      }[] = [];
      leadTimeChange.forEach(item => {
        const timeInMs =
          new Date(item.mrMergedOn).getTime() -
          new Date(item.mrCreatedOn).getTime();
        const timeInDays = Math.round(timeInMs / (1000 * 60 * 60 * 24)); // Convert ms to days
        newDataset.push({
          mrId: item.mrId,
          time: timeInDays || 1,
          mrCreatedOn: item.mrCreatedOn,
          mrMergedOn: item.mrMergedOn,
        });
      });

      newDataset.sort((a, b) => a.time - b.time);
      setDataset(newDataset);
    }
  }, [leadTimeChange]);

  return (
    <Card style={{ height: '35rem' }}>
      <CardContent>
        <Box>
          {dataset.length > 0 && (
            <BarChart
              dataset={dataset}
              yAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'mrId',
                  tickLabelStyle: {
                    fontSize: 12,
                    textAnchor: 'end',
                  },
                  width: 100,
                },
              ]}
              series={[
                {
                  dataKey: 'time',
                  label: 'Lead Time (Days)',
                  valueFormatter,
                },
              ]}
              layout="horizontal"
              {...chartSetting}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
