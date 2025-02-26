<template>
  <div ref="chartRef" :style="{ height, width }"></div>
  <div class="result-error__content" v-if="errorMsg.length!==0">
      <div class="mb-4 m4p" v-for="(item, index) in errorMsg">
        {{item}}
      </div>
     
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, Ref, computed, getCurrentInstance } from "vue";
  import { useECharts } from '@/hooks/web/useECharts';
  import { basicProps } from './props';
  import 'echarts/lib/chart/boxplot'

  const instance = getCurrentInstance();
  const globalProportion = instance.appContext.config.globalProperties.$proportion;
  const props =defineProps({
    ...basicProps,
    datasource:{
        type: Object,
        required: true
    }
  });
  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  let maxPlaces = 6;

  const getMaxY = function(points,ucl){
    let values = points.map(function (item) {
          return item['value'];
        });
    values.push(ucl);
    let max = Math.max(...values) ;
    return roundTo(max+max*globalProportion,maxPlaces);
  }

  const getMinY = function(points,lcl){
    let values = points.map(function (item) {
          return item['value'];
        });
    values.push(lcl);
    let min = Math.min(...values) ;
    min = min-min*globalProportion;
    if(min < 0&&min>0){
      min = 0
    }
    return roundTo(min,maxPlaces);
  }

  //保留n位小数
  function roundTo(num, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
  }

  //数组中小数最大位数
  function getMaxDecimalPlaces(numbers) {
        let maxPlaces = 0;
        // 遍历数组中的每个数字
        for (let i = 0; i < numbers.length; i++) {
            const numStr = numbers[i].toString();
            // 检查数字字符串中是否包含小数点
            const decimalIndex = numStr.indexOf('.');
            if (decimalIndex!== -1) {
                // 计算小数点后的位数
                const decimalPlaces = numStr.length - decimalIndex - 1;
                // 更新最大小数点位数
                if (decimalPlaces > maxPlaces) {
                    maxPlaces = decimalPlaces;
                }
            }
        }
        return maxPlaces;
    };

  const errorMsg  = ref([]);

  onMounted(() => {
    let {points,ucl,lcl,average,errors} = props.datasource;
    let max = getMaxY(points,ucl);
    let min = getMinY(points,lcl);

    errorMsg.value = errors;
    setOptions({
      // title: {
      // //  text: 'X̄-R',
      //   left: '1%'
      // },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '5%',
        right: '15%',
        bottom: '10%'
      },
      xAxis: {
        data: points.map(function (item) {
          return item['axis'];
        })
      },
      yAxis: {
        nameTruncate :{
          maxWidth:1
        },
        type:'value',
        max: max,
        min: min,
        axisLabel: {
                    // 刻度值，格式化函数，截断过长的文本并添加省略号
                    formatter: function (value) {
                      let label = value+"";
                        if (label.length > 5) {
                            return label.slice(0, 5) + '...';
                        }
                        return label;
                    }
                }
      },
      toolbox: {
        right: 10,
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        }
      },
      dataZoom: [
        {
          type: 'inside'
        }
      ],
      series: {
      //  name: 'X̄-R',
        type: 'line',
        data: points.map(function (item) {
          if(item.error){
            //异常点标为红色
            return {
                    value: item['value'],
                    itemStyle: {
                        color: 'red'
                    },
                    symbol: 'circle', // 设置标记为圆形
                    symbolSize: 10, // 增大标记的大小
                    symbolStyle: {
                        // 设置填充颜色为红色，使其为实心
                        fill: 'red',
                        stroke: 'red'
                    }
                };
          }else{
            return item['value'];
          }
          
        }),
        markLine: {
          silent: true,
          lineStyle: {
            color: 'red'
          },
          data: [{
                yAxis: ucl,
                label:{
                    formatter:"UCL="+ucl
                }
            },{
                yAxis: average,
                label:{
                    formatter:"AVG="+average
                }
            },{
                yAxis: lcl,
                label:{
                    formatter:"LCL="+lcl
                }
            },
            ]
        }
      }
    });
  });
</script>
<style lang="less" scoped>
  .result-error {
    padding: 16px 10px;
    background-color: @component-background;

    &__content {
      padding: 10px 16px;
      height: 66px;
      overflow-y: auto;
      background-color: @app-content-background;

      &-icon {
        color: #ff4d4f;
      }
    }
  }
  .m4p{
    color: red;padding-bottom: 0;margin-bottom: 0px;
  }
</style>
