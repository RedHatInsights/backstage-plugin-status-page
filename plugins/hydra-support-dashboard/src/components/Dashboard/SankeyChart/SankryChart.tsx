import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { useTheme } from '@material-ui/core';
import useStyles from './sankey.styles';

Chart.register(...registerables);
Chart.register(SankeyController, Flow);

interface ISankeyData {
  from: string;
  to: string;
  flow: number;
}

interface ISankeyProps {
  visualData: ISankeyData[];
  mode: string;
  totalJiras: number;
}

export const SankeyChart = (props: ISankeyProps) => {
  const canvasCtx: any = useRef();
  const theme: any = useTheme();
  const classes = useStyles(theme);
  const currentTheme = props.mode;

  const colors = [
    '#92c5f9', // blue-30
    '#0066cc', // blue-50
    '#ca6c0f', // orange-50
    '#f8ae54', // orange-30
  ];

  const sankeyHeaders = [
    'Hydra Support EPIC Name',
    'CMDB Criticality',
    'JIRA Status',
  ];
  const assigned: any = {};
  const getColors = (name: string) => {
    return (
      assigned[name] ||
      (assigned[name] = colors[Object.keys(assigned).length % colors.length])
    );
  };

  const getTextAllignement = (index: number) => {
    switch (index) {
      case 1:
        return 'center';
      case 2:
        return 'right';
      default:
        return 'left';
    }
  };

  useEffect(() => {
    let chart2: any = null;
    if (canvasCtx.current) {
      const ctx2 = canvasCtx.current.getContext('2d');
      chart2 = new Chart(ctx2, {
        type: 'sankey',
        options: {
          onClick(_event, _elements, _chart) {
            // narrow down code
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: tooltipItem => {
                  const data: any = tooltipItem.raw;
                  return ` ${JSON.stringify(data.flow)} JIRAs`;
                },
              },
            },
          },
        },
        data: {
          datasets: [
            {
              data: props.visualData,
              colorFrom: color =>
                getColors(color.dataset.data[color.dataIndex].from),
              colorTo: color =>
                getColors(color.dataset.data[color.dataIndex].to),
              borderWidth: 0,
              color: currentTheme === 'dark' ? 'white' : 'black',
              font: { size: 17 },
              nodeWidth: 10,
              priority: { C1: 100 },
            },
          ],
        },
      });
    }
    return () => {
      if (chart2) {
        chart2.destroy();
      }
    };
  });

  return (
    <div style={{ width: '100%' }}>
      <div className={classes.legendContainer}>
        {sankeyHeaders.map((title, index) => {
          return (
            <div
              className={classes.legend}
              style={{
                textAlign: getTextAllignement(index),
              }}
            >
              {title}
            </div>
          );
        })}
      </div>
      <div className="chart">
        <canvas ref={canvasCtx} id="chart2" />
      </div>
      <div
        style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold' }}
      >
        The above stats are based on {props.totalJiras} total JIRAS
      </div>
    </div>
  );
};
