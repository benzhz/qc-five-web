<template>
  <div id="main" ref="chartRef" :style="{ height, width }"></div>
  <BasicTable @register="registerTestTable" />
</template>
<script lang="ts" setup>
  import { onMounted, ref, Ref,getCurrentInstance  } from 'vue';
  import { basicProps } from './props';
  import * as echarts from 'echarts';
  import { BasicTable, useTable } from '@/components/Table';

  const instance = getCurrentInstance();
  const globalProportion = instance.appContext.config.globalProperties.$proportion;

  const props = defineProps({
    ...basicProps,
    datasource:{
        type: Object,
        required: true
    }
  });
  
  const testTableSchema= [
  {
    title: '检验方法',
    width: 200,
    dataIndex: 'testMethod',
  },
  {
    title: '统计量',
    width: 100,
    dataIndex: 'statistic',
  },
  {
    title: 'p值',
    width: 100,
    dataIndex: 'pvalue',
  },
  {
    title: '判定',
    width: 200,
    dataIndex: 'judge',
  }
];

const testTableData =  props.datasource.testBos;

const chartData =  props.datasource.normalProbabilityChart;


  const [registerTestTable] = useTable({
    dataSource: testTableData,
    columns: testTableSchema,
    pagination: false,
    showIndexColumn: false,
    scroll: { y: 326  },
  });

let intercept=chartData.intercept>0?'+ '+chartData.intercept:' '+chartData.intercept;

let formatterStr = 'y = '+ chartData.slope +' * x'+intercept;

let theoreticalValues = chartData.theoreticalValues;

let cdfValues = chartData.cdfValues;

let sampleData = chartData.sampleData;
const minValue = Math.max(theoreticalValues[0], sampleData[0]);
const maxValue= Math.min(theoreticalValues[theoreticalValues.length-1], sampleData[theoreticalValues.length-1]);

const xMinValue = minValue- minValue*globalProportion;
const  xMaxValue= maxValue+maxValue*globalProportion;

const markLineOpt = {
  animation: false,
  label: {
    //formatter: formatterStr,
    align: 'right'
  },
  lineStyle: {
    type: 'solid'
  },
  tooltip: {
    formatter: formatterStr
  },
  data: [
    [
      {
        coord: [theoreticalValues[0],cdfValues[0]*100],
        symbol: 'none'
      },
      {
        coord: [ theoreticalValues[theoreticalValues.length-1],cdfValues[cdfValues.length-1]*100],
        symbol: 'none'
      }
    ]
  ]
};
const option = ref({
  title: {
    text: "正态概率图",
    left: 'center',
    top: 0
  },
  tooltip: {
    formatter: 'Group {a}: ({c})'
  },
  xAxis: [
    { gridIndex: 0, min: xMinValue, max: xMaxValue },
  ],
  yAxis: [
    { gridIndex: 0, min: 0, max: 100 },
  ],
  series: [
    {
      name: 'I',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: sampleData.map(function (item,index) {
          return [item,cdfValues[index]*100];
        }),
      markLine: markLineOpt
    }
  ]
});
  onMounted(() => {
    var chartDom = document.getElementById('main');
    var myChart = echarts.init(chartDom);
     option.value && myChart.setOption(option.value);
  })
</script>
