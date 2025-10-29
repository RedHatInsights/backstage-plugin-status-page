import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts';
import { useEffect, useState } from 'react';

const chartSetting = {
  width: 400,
  height: 80,
  sx: {
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: 'translate(-20px, 0)',
    },
  },
  margin: { left: 0, right: 15, top: 10, bottom: 5 },
};

const valueFormatter = (value: any) => value || 0;

export const DeploymentFrequency = ({ deployments }: { deployments: any[] }) => {

    const [dataset, setDataset] = useState<any[]>([]);

    useEffect(() => {
        if(deployments.length) {
            const deploymentCountToDateMap: {[key: string]: number} = {};
            deployments.forEach((deployment) => {
                const date = new Date(deployment.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
                if(deploymentCountToDateMap[date]) {
                    deploymentCountToDateMap[date] += 1;
                } else {
                    deploymentCountToDateMap[date] = 1;
                }
            });
            setDataset(Object.entries(deploymentCountToDateMap).map(([date, count]) => ({
                date,
                count,
            })));
        }
    }, [deployments]);

  return (
    <BarChart
      dataset={dataset}
      xAxis={[{ scaleType: 'band', dataKey: 'date', categoryGapRatio: 0.7 }]}
      series={[
        { dataKey: 'count', valueFormatter },
      ]}
      {...chartSetting}
    />
  );
}