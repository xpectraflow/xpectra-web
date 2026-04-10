'use client';

import { PageLayout } from '@/components/PageLayout';
import { UsageCard } from '@/components/UsageCard';
import { trpc } from '@/lib/trpc';
import ReactECharts from 'echarts-for-react';

export default function UsagePage() {
  const datasetsQuery = trpc.datasets.getAllDatasets.useQuery();
  const experimentsQuery = trpc.experiments.getExperiments.useQuery();

  const datasetCount = datasetsQuery.data?.length ?? 0;
  const experimentCount = experimentsQuery.data?.length ?? 0;

  const chartTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8' },
  };

  const trendOption = {
    ...chartTheme,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      boundaryGap: false,
    },
    yAxis: { type: 'value', name: 'GB' },
    series: [
      {
        name: 'Ingestion',
        type: 'line',
        smooth: true,
        data: [0, 0, 0, 0, 0, 0, 0],
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ]
          }
        },
        lineStyle: { color: '#3b82f6', width: 3 },
      },
    ],
  };

  const allocationOption = {
    ...chartTheme,
    tooltip: { trigger: 'item' },
    series: [
      {
        name: 'Usage',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#1e293b',
          borderWidth: 2
        },
        label: { show: false },
        data: [
          { value: datasetCount, name: 'Datasets', itemStyle: { color: '#3b82f6' } },
          { value: experimentCount, name: 'Experiments', itemStyle: { color: '#f59e0b' } },
        ]
      }
    ]
  };

  return (
    <PageLayout
      title="Subscription capacity"
      description="Usage and limits for the current billing period"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <UsageCard
            title="Submitted tasks"
            subtitle="In the last 30 days"
            value="0"
            footer="of 250 (0%)"
            progress={0}
            variant="default"
          />

          <UsageCard
            title="Data egress"
            subtitle="In the last 30 days"
            value="0.0 KiB"
            footer="of 500.0 MiB (0%)"
            progress={0}
            variant="accent"
          />

          <UsageCard
            title="Dataset storage"
            subtitle="Total used size in bytes"
            value="0 B"
            footer="of 1.0 GiB (0%)"
            progress={0}
            variant="default"
          />

          <UsageCard
            title="Experiments"
            subtitle="Total number of dataset collections"
            value={experimentCount.toString()}
            footer="Unlimited"
            progress={0}
            variant="unlimited"
          />

          <UsageCard
            title="Datasets"
            subtitle="Total number of created datasets"
            value={datasetCount.toString()}
            footer={`of 10 (${Math.round((datasetCount / 10) * 100)}%)`}
            progress={(datasetCount / 10) * 100}
            variant="accent"
          />

        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Data Ingestion Trend</h3>
            <div className="h-[300px] w-full">
              <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground italic">Current billing period ingestion is at 0.0 GB</p>
          </div>


        </div>
      </div>
    </PageLayout>
  );
}

