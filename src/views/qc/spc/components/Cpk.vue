<template>
  <div id="main" ref="chartRef" :style="{ height, width }"></div>
  <Description size="middle" :bordered="true" :column="4" :data="basicData" :schema="basicSchema" />
  <BasicTable @register="registerCpkTable" />
</template>
<script lang="ts" setup>
  import { basicProps } from './props';
  import { computed, onMounted, ref } from 'vue';
  import * as echarts from 'echarts';
  import { Description } from '@/components/Description';
  import { BasicTable, useTable } from '@/components/Table';

  const props = defineProps({
    ...basicProps,
    datasource: {
      type: Object,
      required: true,
    },
  });

  const cpkTableData = ref(props.datasource.quotas);
  const basicData = ref(props.datasource);
  let chartData = props.datasource;
  const barMap = ref(chartData.barMap);

  const normalDistributionV = ref(chartData.normalDistribution);
  const withinNormalDistribution = ref(chartData.withinNormalDistribution);
  const standardDeviation = ref(chartData.stdDev);
  const average = ref(chartData.average);
  const min = ref(chartData.min);
  const max = ref(chartData.max);
  const lsl = ref(chartData.lsl);
  const usl = ref(chartData.usl);
  const averageXAxis = ref(line(barMap.value, average.value));
  const lslXAxis = ref(line(barMap.value, lsl.value));
  const uslXAxis = ref(line(barMap.value, usl.value));

  //一倍标准差
  const standarDevRangeOfOne = computed(() => {
    let up = average.value + standardDeviation.value;
    let low = average.value - standardDeviation.value;
    return {
      data: {
        up: up,
        low: low,
      },
      xAxis: {
        up: line(barMap.value, up),
        low: line(barMap.value, low),
      },
    };
  });

  //二倍标准差
  const standarDevRangeOfTwo = computed(() => {
    let up = average.value + 2 * standardDeviation.value;
    let low = average.value - 2 * standardDeviation.value;
    return {
      data: {
        up: up,
        low: low,
      },
      xAxis: {
        up: line(barMap.value, up),
        low: line(barMap.value, low),
      },
    };
  });

  //三倍标准差
  const standarDevRangeOfThree = computed(() => {
    let up = average.value + 3 * standardDeviation.value;
    let low = average.value - 3 * standardDeviation.value;
    return {
      data: {
        up: up,
        low: low,
      },
      xAxis: {
        up: line(barMap.value, up),
        low: line(barMap.value, low),
      },
    };
  });

  //基础信息
  const basicSchema = [
    {
      field: 'totalCount',
      label: '总样本数',
    },
    {
      field: 'subgroupSize',
      label: '子组大小',
    },
    {
      field: 'chart',
      label: '图表类型',
    },
    {
      field: 'average',
      label: '平均值',
    },
    {
      field: 'stdDev',
      label: '标准差',
    },
    {
      field: 'max',
      label: '最大值',
    },
    {
      field: 'min',
      label: '最小值',
    },
    {
      field: 'usl',
      label: '上规格',
    },
    {
      field: 'standard',
      label: '目标值',
    },
    {
      field: 'lsl',
      label: '下规格',
    },
    {
      field: 'positive3Sigma',
      label: '+3Sigma',
    },
    {
      field: 'negative3Sigma',
      label: '-3Sigma',
    },
  ];

  //cpk指标表
  const cpkTableSchema = [
    {
      title: '指标名',
      width: 150,
      dataIndex: 'name',
    },
    {
      title: '组内(cpk)',
      width: 150,
      dataIndex: 'groupValue',
    },
    {
      title: '整体(ppk)',
      width: 150,
      dataIndex: 'gobleValue',
    },
  ];

  const [registerCpkTable] = useTable({
    dataSource: cpkTableData,
    columns: cpkTableSchema,
    pagination: false,
    showIndexColumn: false,
    scroll: { y: 326 },
  });

  //小数点后一位以0.5为间隔，向下取

  function roundToNearestHalf(num) {
    // 获取整数部分
    const integerPart = Math.floor(num);
    // 获取小数部分
    const decimalPart = num - integerPart;
    // 获取小数部分的十分位
    const tenthsPlace = Math.floor(decimalPart * 10);

    if (tenthsPlace < 5) {
      // 若十分位小于 5，将小数部分置为 0
      return integerPart;
    } else {
      // 若十分位大于等于 5，将小数部分置为 0.5
      return integerPart + 0.5;
    }
  }

  function line(barMap, value) {
    let res = value;
    let barKeys = Object.keys(barMap);
    let length = barKeys.length;
    let range = barKeys[1] - barKeys[0];
    for (let i = 0; i < length; i++) {
      let key = barKeys[i];
      if (i + 1 == length) {
        if (value <= key + range) {
          res = key;
        }
        break;
      }
      let nextKey = barKeys[i + 1];
      if (key <= value && value <= nextKey) {
        res = key;
        break;
      }
    }
    return res;
  }

  onMounted(() => {
    initChartsData('chart'); // 生成 Echarts 图
  });

  function initChartsData(ref) {
    var chartDom = document.getElementById('main');
    var chart = echarts.init(chartDom);

    //Echarts 图的配置
    let options = {
      // Echarts 图 -- 标题
      // title: {
      // 	text: ''
      // },
      // Echarts 图 -- 工具
      tooltip: {},
      // Echarts 图 -- 图例
      legend: {
        data: ['整体正态分布', '组内正态分布', '样本数据'],
      },
      // Echarts 图 -- x 坐标轴刻度 -- 正态分布数值
      xAxis: [
        {
          // name : "标准刻度(0.1)",
          data: Object.keys(barMap.value),
          // min: min.value,
          // max: max.value
        },
      ],
      // Echarts 图 -- y 坐标轴刻度
      yAxis: [
        {
          type: 'value',
          name: '频数',
          position: 'left',
          // 网格线
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: 'orange',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
        {
          type: 'value',
          name: '概率',
          position: 'right',
          // 网格线
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: 'black',
            },
          },
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      // Echarts 图 -- y 轴数据
      series: [
        {
          name: '样本数据', // y 轴名称
          type: 'bar', // y 轴类型
          yAxisIndex: 0,
          barGap: 0,
          barWidth: 27,
          itemStyle: {
            normal: {
              show: true,
              color: 'rgba(255, 204, 0,.3)', //柱子颜色
              borderColor: '#FF7F50', //边框颜色
            },
          },
          data: Object.values(barMap.value), // y 轴数据 -- 源数据
        },
        {
          name: '整体正态分布', // y 轴名称
          type: 'line', // y 轴类型
          symbol: 'none', //去掉折线图中的节点
          smooth: false, //true 为平滑曲线
          yAxisIndex: 1,
          data: normalDistributionV.value, // y 轴数据 -- 正态分布
          // 警示线
          markLine: {
            symbol: ['none'], // 箭头方向
            lineStyle: {
              type: 'silent',
              color: 'green',
            },
            itemStyle: {
              normal: {
                show: true,
                color: 'black',
              },
            },
            label: {
              show: true,
              position: 'middle',
            },
            data: [
              {
                name: '一倍标准差',
                xAxis: standarDevRangeOfOne.value.xAxis.low,
                // 当 n 倍标准差在坐标轴外时，将其隐藏，否则它会默认显示在最小值部分，容易引起混淆
                tooltip: {
                  formatter: function () {
                    return '一倍标准差  ' + standarDevRangeOfOne.value.data.low;
                  },
                },
                lineStyle: {
                  opacity: 1,
                },
                label: {
                  formatter: function () {
                    return '-σ';
                  },
                },
              },
              {
                name: '一倍标准差',
                xAxis: standarDevRangeOfOne.value.xAxis.up,
                tooltip: {
                  formatter: function () {
                    return '一倍标准差  ' + standarDevRangeOfOne.value.data.up;
                  },
                },
                lineStyle: {
                  opacity: 1,
                },
                label: {
                  formatter: function () {
                    return '+σ';
                  },
                },
              },
              {
                name: '二倍标准差',
                xAxis: standarDevRangeOfTwo.value.xAxis.low,
                tooltip: {
                  formatter: function () {
                    return '二倍标准差  ' + standarDevRangeOfOne.value.data.low;
                  },
                },
                lineStyle: {
                  opacity: 1,
                  color: 'blue',
                },
                label: {
                  formatter: function () {
                    return '-2σ';
                  },
                },
              },
              {
                name: '二倍标准差',
                xAxis: standarDevRangeOfTwo.value.xAxis.up,
                tooltip: {
                  formatter: function () {
                    return '二倍标准差  ' + standarDevRangeOfOne.value.data.up;
                  },
                },
                lineStyle: {
                  opacity: 1,
                  color: 'blue',
                },
                label: {
                  formatter: function () {
                    return '+2σ';
                  },
                },
              },
              {
                name: '三倍标准差',
                xAxis: standarDevRangeOfThree.value.xAxis.low,
                tooltip: {
                  formatter: function () {
                    return '三倍标准差  ' + standarDevRangeOfOne.value.data.low;
                  },
                },
                lineStyle: {
                  opacity: 1,
                  color: 'orange',
                },
                label: {
                  formatter: function () {
                    return '-3σ';
                  },
                },
              },
              {
                name: '三倍标准差',
                xAxis: standarDevRangeOfThree.value.xAxis.up,
                tooltip: {
                  formatter: function () {
                    return '三倍标准差  ' + standarDevRangeOfOne.value.data.up;
                  },
                },
                lineStyle: {
                  opacity: 1,
                  color: 'orange',
                },
                label: {
                  formatter: function () {
                    return '+3σ';
                  },
                },
              },
              {
                name: '平均值',
                // type: 'average',
                xAxis: averageXAxis.value,
                tooltip: {
                  formatter: function () {
                    return '平均值  ' + average.value;
                  },
                },
                lineStyle: {
                  color: 'red',
                },
                label: {
                  formatter: function () {
                    return 'x̄';
                  },
                },
              },
              {
                name: 'USL',
                // type: 'average',
                xAxis: uslXAxis.value,
                tooltip: {
                  formatter: function () {
                    return 'USL  ' + usl.value;
                  },
                },
                lineStyle: {
                  color: 'red',
                },
                label: {
                  formatter: function () {
                    return 'USL';
                  },
                },
              },
              {
                name: 'LSL',
                // type: 'average',
                xAxis: lslXAxis.value,
                tooltip: {
                  formatter: function () {
                    return 'LSL  ' + lsl.value;
                  },
                },
                lineStyle: {
                  color: 'red',
                },
                label: {
                  formatter: function () {
                    return 'LSL';
                  },
                },
              },
            ],
          },
        },
        {
          name: '组内正态分布', // y 轴名称
          type: 'line', // y 轴类型
          symbol: 'none', //去掉折线图中的节点
          smooth: true, //true 为平滑曲线
          yAxisIndex: 1,
          emphasis: {
            focus: 'series',
          },
          data: withinNormalDistribution.value, // y 轴数据 -- 正态分布
        },
      ],
    };

    chart.setOption(options);
    window.addEventListener('resize', () => {
      chart.resize();
    });
  }
</script>
