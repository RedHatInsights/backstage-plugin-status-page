import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Card, CardContent } from '@material-ui/core';
import { useEffect, useState } from 'react';

const chartSetting = {
  xAxis: [
    {
      label: 'Lead Time for change (Days)',
    },
  ],
  width: 700,
  height: 350,
  margin: { left: 50, right: 50, top: 10, bottom: 50 },
};

const valueFormatter = (value: any) => `${value}days`;

export function LeadTimeChangeChart({
  leadTimeChange,
}: {
  leadTimeChange: {
    jiraCreatedOn: string;
    jiraResolution: string;
    jiraNumber: string;
  }[];
}) {
  const [dataset, setDataset] = useState<
    {
      time: number;
      jiraNumber: string;
      jiraCreatedOn: string;
      jiraResolution: string;
    }[]
  >([]);

  useEffect(() => {
    if (leadTimeChange) {
      const newDataset: {
        time: number;
        jiraNumber: string;
        jiraCreatedOn: string;
        jiraResolution: string;
      }[] = [];
      leadTimeChange.forEach(item => {
        const timeInMs =
          new Date(item.jiraResolution).getTime() -
          new Date(item.jiraCreatedOn).getTime();
        const timeInDays = Math.round(timeInMs / (1000 * 60 * 60 * 24)); // Convert ms to days
        newDataset.push({
          jiraNumber: item.jiraNumber,
          time: timeInDays,
          jiraCreatedOn: item.jiraCreatedOn,
          jiraResolution: item.jiraResolution,
        });
      });

      newDataset.sort((a, b) => a.time - b.time);
      setDataset(newDataset);
    }
  }, [leadTimeChange]);

  return (
    <Card style={{ height: '25rem' }}>
      <CardContent>
        <Box>
          <BarChart
            dataset={dataset}
            yAxis={[
              {
                scaleType: 'band',
                dataKey: 'jiraNumber',
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
        </Box>
      </CardContent>
    </Card>
  );
}
