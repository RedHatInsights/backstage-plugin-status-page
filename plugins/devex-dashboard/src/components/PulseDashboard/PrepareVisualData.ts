import pluginDiscoveryData from './PluginDiscovery.json';

export const getPluginInterpolationChart = (reportData: any) => {
  try {
    let pluginsDeployed = {};
    pluginDiscoveryData.data.forEach(plugin => {
      if (plugin.lifecycle === 'production' && plugin.viewUrl)
        pluginsDeployed = {
          ...pluginsDeployed,
          [plugin.viewUrl]: plugin.title,
        };
    });
    let chartData: any = {};
    const xLabels = Object.keys(reportData);
    Object.keys(reportData).forEach((date: string) => {
      if (reportData[date].length) {
        Object.keys(pluginsDeployed).forEach((pluginUrl: string) => {
          const foundData = reportData[date].find((data: any) =>
            data.label.includes(pluginUrl),
          );
          const pluginName =
            pluginDiscoveryData.data.find(
              plugin => plugin?.viewUrl && plugin.viewUrl === pluginUrl,
            )?.title || 'Index';

          if (foundData) {
            chartData = chartData[pluginName]
              ? {
                  ...chartData,
                  [pluginName]: [...chartData[pluginName], foundData.nb_visits],
                }
              : {
                  ...chartData,
                  [pluginName]: [foundData.nb_visits],
                };
          } else {
            chartData = chartData[pluginName]
              ? {
                  ...chartData,
                  [pluginName]: [...chartData[pluginName], 0],
                }
              : {
                  ...chartData,
                  [pluginName]: [0],
                };
          }
        });
      } else {
        Object.keys(chartData).forEach((pluginName: string) => {
          chartData = chartData[pluginName]
            ? {
                ...chartData,
                [pluginName]: [...chartData[pluginName], 0],
              }
            : { ...chartData, [pluginName]: [0] };
        });
      }
    });
    const formattedChartData: any = [];
    Object.keys(chartData).forEach((pluginName: string) => {
      formattedChartData.push({
        data: chartData[pluginName],
        label: pluginName,
      });
    });
    return { xLabels: xLabels, data: formattedChartData };
  } catch (err) {
    return {};
  }
};
