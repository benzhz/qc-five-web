<template>
  <PageWrapper dense contentFullHeight fixedHeight contentClass="flex">
    <ChartTree class="w-1/4 xl:w-1/5" @select="handleSelect" />
    <div class="w-3/4 xl:w-4/5 padding16"  v-if="selectNode">
      <Card  class="!my-4 enter-y" 
        :tab-list="tabListTitle"
        v-bind="$attrs"
        :active-tab-key="activeKey"
        @tab-change="onTabChange"
        v-if="isShowChart"
      >
       <div v-for="(item,index) in chartData">
          <p  v-if="activeKey === item.label">
          <VisitAnalysis :datasource="chartData[index]" />
        </p>
        </div>
        <p  v-if="activeKey === '过程能力报告'">
         <Cpk :datasource="cpkData" />
        </p>
        <p  v-if="activeKey === '正态性检验'">
          <NormalDistributionValid :datasource="testData" />
        </p>
      </Card>
      <BasicTable @register="registerTable" v-if="isShowTable">
        <template #toolbar>
          <a class="m-3" type="primary" @click="downloadExcelTemplate"> Excel模板下载 </a>
        <ImpExcel @success="loadDataSuccess" dateFormat="YYYY-MM-DD">
          <a-button class="m-3" type="primary"> 导入样本数据 </a-button>
        </ImpExcel>
      </template>
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.key === 'id'"> ID: {{ record.id }} </template>
        <template v-else-if="column.key === 'no'">
          <Tag color="green">
            {{ record.no }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'avatar'">
          <Avatar :size="60" :src="record.avatar" />
        </template>
        <template v-else-if="column.key === 'imgArr'">
          <TableImg :size="60" :simpleShow="true" :imgList="text" />
        </template>
        <template v-else-if="column.key === 'imgs'">
          <TableImg :size="60" :imgList="text" />
        </template>

        <template v-else-if="column.key === 'category'">
          <Tag color="green">
            {{ record.no }}
          </Tag>
        </template>
      </template>
    </BasicTable>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>

  import { BasicTable, useTable, TableImg } from '@/components/Table';
  import { PageWrapper } from '@/components/Page';
  import ChartTree from './ChartTree.vue';
  import { ImpExcel, ExcelData } from '@/components/Excel';
  import { importSpcChart } from '@/api/qc/spc';
  import { getSpcChartList } from '@/api/qc/spcChartInfo';
  import {  message } from 'ant-design-vue';
  import { Card } from 'ant-design-vue';
  import VisitAnalysis from './components/VisitAnalysis.vue';
  import Cpk from './components/Cpk.vue';
  import NormalDistributionValid from './components/NormalDistributionValid.vue';
  import { useMessage } from '@/hooks/web/useMessage';

  import { ref, computed } from 'vue';

  defineOptions({ name: 'AccountManagement' });

  const activeKey = ref('');

  const isShowChart = ref(false);

  const { createMessage } = useMessage();


  //spc控制图数据
  const chartData =ref<
    {
      label: string;
    }[]
  >([]);

  //cpk数据
  const cpkData =ref([]);


  //正态性检验数据
  const testData =ref([]);

  const isShowTable =  computed(() => {
    return (activeKey.value!=='正态性检验')&&(activeKey.value!=='过程能力报告');
  });


  //图表tab
  const tabListTitle = ref<
    {
      tab: string;
      key:string;
    }[]
  >([
  ]);

  function onTabChange(key) {
    activeKey.value = key;
  }
  
  //表格结构
  const columns = ref([
  ]);

  
  const sampleList = ref<
    {
      chartId: string;
      chart:string;
      title: string;
      columns?: any[];
      dataSource?: any[];
    }[]
  >([]);

  //样本数据表格的行
  const dataSource = ref([]);


  const [registerTable,{reload}] = useTable({
    title: '样本数据',
    // api: demoListApi,
    columns: columns,
    bordered: true,
    pagination: false,
    dataSource: dataSource,
    showTableSetting: true,
  });

  let fieldMap = {
    "抽检时间":"sampleTime",
    "样本":"sample",
    "样品数量":"totalNum",
    "不合格品数":"failNum",
    "不合格品率":"failRate",
    "缺陷数":"defectNum"
  }

  //生成excel中各列的字段名
  function getField(title,fieldMapping){
    let field = fieldMap[title];
    if(!field){
      field =  fieldMap[title.slice(0,2)];
      if(!field){
        field="field";
      }else{
        field+=title.slice(2);
      }
    }
    fieldMapping[title] = field;
    
    return field.replace(/\s/g, '')
    
  }

  //当前选中树的节点
  let currentNode ;

  //是否选中节点
  const selectNode = ref(false);

  //下载excel模板
  const downloadExcelTemplate = () => {
    if(!currentNode){
      message.error('请先选中左侧节点');
    }
    const url = '/basic-api/spc/downloadExcelTemplate?chartId='+currentNode.id;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'excel_template.xlsx';
    a.click();
  };


  //左树点击
  function handleSelect(node){
    currentNode = node;
    selectNode.value =true;
    getSpcCharts();
  }


  //由excel构建样本数据表格
  function buildSampleTable(excelData,fieldMapping){
    const {
        header,
        results,
        meta: { sheetName },
      } = excelData;
      const importColumns:any[] = [];
      for (const title of header) {
        let obj ={ title: title, dataIndex: getField(title,fieldMapping) };
        importColumns.push(obj);
      }
      let importDataSource:any[] = [];
      results.map(item => {
        let obj ={};
         for (var key of Object.keys(fieldMapping)) {
            if(item[key]){
              obj[fieldMapping[key]] = item[key];
            }
          }
          importDataSource.push(obj);
      });
      return {sheetName,importDataSource,importColumns};
  }

  //获取spc图标信息
  function getSpcCharts(){
    getSpcChartList({id:currentNode.id}).then(res=>{
              chartData.value =[];
              cpkData.value =[];
              testData.value =[];
              tabListTitle.value.length =0;
              columns.value = [];
              dataSource.value = [];
              isShowChart.value = false;
              activeKey.value = '';
            if(res.controlChar){
              //spc控制图
              chartData.value = res.controlChar.calBos;
              //cpk
              cpkData.value=res.cpk;
              //正态校验
              testData.value = res.test;
              //生成tab
              tabListTitle.value.length =0;
              chartData.value.forEach((v, i) => 
                tabListTitle.value.push({key:v.label,tab:v.label})
              );
              if(testData.value && testData.value.testBos.length>0){
                  tabListTitle.value.push({"key":"正态性检验","tab":"正态性检验"});
              }
              if(cpkData.value && cpkData.value.quotas.length>0){
                 tabListTitle.value.push({"key":"过程能力报告","tab":"过程能力报告"});
              }
              setTimeout(()=>{
                activeKey.value =tabListTitle.value[0].key;
              },100);  
              //表格数据
              columns.value = res.tableColumns;
            
              dataSource.value = res.tableData;
              isShowChart.value = true;
              reload();
            }
        });
  }

  function filterEmptyObjects(arr) {
    return arr.filter(obj => {
      return Object.values(obj).some(value => {
        if (typeof value === "string") {
          return value.trim()!== "";
        }
        return value!== null && value!== undefined;
      });
    });
  }

  //导入样本数据处理
  function loadDataSuccess(excelDataList: ExcelData[]) {
    if(!currentNode){
      createMessage.error('请先选中左侧节点');

    }
    sampleList.value = [];
    console.log(excelDataList);
    let fieldMapping = {};
    //excelData只会有一个

      let excelData = excelDataList[0];
      //创建样本数据表格
     let {sheetName,importDataSource,importColumns} = buildSampleTable(excelData,fieldMapping);
      sampleList.value.push({'chartId':currentNode.id,chart:currentNode.chart, title: sheetName, dataSource: importDataSource, columns: importColumns });
      //向服务端导入样本数据
      let sampleData = sampleList.value[0];
      //去除excel中空行
      sampleData.dataSource=filterEmptyObjects(sampleData.dataSource);
      importSpcChart(sampleData).then(res=>{
        //导入成功，加载图表数据
        getSpcCharts();
      })
  }

 
</script>

<style>
.ant-card-body{
  max-height: calc(100vh - 160px) !important;
  overflow: auto;
  padding-bottom: 0px !important;

}
.padding16{
  padding-left: 16px;padding-right: 16px;
}
</style>
