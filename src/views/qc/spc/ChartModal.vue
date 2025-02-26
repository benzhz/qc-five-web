<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #fac="{ model, field }">
            <Input.Group >
              <Row :gutter="8">
                <Col :span="10">
                  <InputNumber  v-model:value="model['standard']" />
                </Col>
                <Col :span="1">
                  ±
                </Col>
                <Col :span="10">
                  <InputNumber  v-model:value="model[field]" />
                </Col>
                <Col :span="3">
                 {{ model['unit'] }}
                </Col>
              </Row>
            </Input.Group>
          </template>
     </BasicForm>
    </BasicModal>
</template>
<script lang="ts" setup>
  import { ref, computed, unref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { FormSchema } from '@/components/Table';
  import {  Input,InputNumber,Row,Col } from 'ant-design-vue';

  defineOptions({ name: 'AccountModal' });

  const emit = defineEmits(['success', 'register']);

  const isUpdate = ref(true);
  const rowId = ref('');

  const chartCategoryOptions = [ {
            label: '计量型',
            value: 'variable',
            key: 'variable',
          },{
            label: '计数型',
            value: 'attribute',
            key: 'attribute',
          }];
  const subgroupSizeMap = {
    "XbarR":{
      min:4,
      max:5
    },
    "XbarS":{
      min:10,
      max:20
    },
    "XMedian":{
      min:5,
      max:9
    },
    "Xmr":{
      min:1,
      max:1
    }
  };
  const chartOptionsMap = 
    {
      "variable":[{
        label: 'XbarR（均值和极差图）',
            value: 'XbarR',
            key: 'XbarR',
      },{ label: 'XbarS（均值和标准差图）',
            value: 'XbarS',
            key: 'XbarS',}
          ,{label: 'XMedian（中位数图）',
            value: 'XMedian',
            key: 'XMedian',},
            {label: 'X-MR（单值和移动极差图）',
            value: 'Xmr',
            key: 'Xmr',}],
      "attribute":[{
        label: 'P（不合格品率的控制图）',
            value: 'P',
            key: 'P',
      },{
        label: 'NP（不合格品数的控制图）',
            value: 'NP',
            key: 'NP',
      },{
        label: 'C（不合格品数(缺陷)控制图）',
            value: 'C',
            key: 'C',

      },{
        label: 'U（单位不合格(缺陷)数控制图）',
            value: 'U',
            key: 'U',
      }],
    }
  ;

  function resetSubgroupSizeRange(e) {
    let range = subgroupSizeMap[e];
    if(range){
      if(range.min===range.max){
        updateSchema({
              field: 'subgroupSize',
              rules: [

              ],
              defaultValue: '1',
              componentProps: {
                disabled: true
              }
            });
      }else{
            updateSchema({
              field: 'subgroupSize',
              rules: [
                { type: 'number', min: range.min, max: range.max, message: '该控制图子组容量必须在 '+range.min+' 到 '+range.max+' 之间', trigger: 'blur' }
              ],
              componentProps: {
                disabled: false
              }
            });
      }
    }
  }

  const accountFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    required: true,
  },
  {
    field: 'parentId',
    label: 'parentId',
    component: 'Input',
    required: true,
    ifShow: false
  },
  {
    field: 'chartCategory',
    label: '控制图类型',
    component: 'ApiSelect',
    required: true,
    componentProps: {
        options: chartCategoryOptions,
        onSelect: (e: any) => {
          let oldData = getFieldsValue();
          //控制图类型变更，要重置部分表单选项跟值
          if(oldData.chartCategory!==e){
            renewSchema(e);
            //重置控制图跟子组容量
            setFieldsValue({
              "chart":"",
              "subgroupSize":"",
            });
          }
         
        },
    },
  },
  {
    field: 'chart',
    label: '控制图',
    component: 'ApiSelect',
    required: true,
    componentProps: {
        onSelect: (e: any) => {
          let oldData = getFieldsValue();
          //控制图类型变更，要重置部分表单选项跟值
          if(oldData.chart!==e){
            resetSubgroupSizeRange(e);
            //重置控制图跟子组容量
            setFieldsValue({
              "subgroupSize":"",
            });
          }
         
        },
    },
  },
  {
    field: 'subgroupSize',
    label: '子组容量',
    component: 'InputNumber',
    required: true,
    rules: [
      { type: 'number', min: 18, max: 60, message: '该控制图子组容量必须在 18 到 60 之间', trigger: 'blur' }
    ],
    ifShow: false
  },
  {
    field: 'standard',
    label: '',
    component: 'InputNumber',
    required: true,
    ifShow: false
  },
  {
    field: 'unit',
    label: '单位',
    component: 'Input',
    required: true,
  },
  {
    field: 'scope',
    label: '产品规格',
    required: true,
    defaultValue: '',
    slot: 'fac',
    colProps: {
      span: 24,
    },
  },
  {
    field: 'description',
    label: '描述',
    component: 'InputTextArea',
    required: false,
  },
];

  const [registerForm, { setFieldsValue,getFieldsValue, updateSchema, resetFields, validate }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: accountFormSchema,
    showActionButtonGroup: false,
    actionColOptions: {
      span: 23,
    },
  });

  function renewSchema(e) {
    let chartOptions =chartOptionsMap[e];
      updateSchema({
              field: 'chart',
              componentProps: {
                options: chartOptions,
              },
            });
      updateSchema({
        field: 'subgroupSize',
        ifShow : e==='variable'
      });
  } 


  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    let  record = data.record;
    if (unref(isUpdate)) {
      rowId.value = record.id;
      let e = record.chartCategory;
      let e2 = record.chart;
      renewSchema(e);
      resetSubgroupSizeRange(e2);
      setFieldsValue({
        ...record,
      });
    }
  });

  const getTitle = computed(() => (!unref(isUpdate) ? '新增SPC控制图' : '编辑SPC控制图'));

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });
      // TODO custom api
      closeModal();
      emit('success', { isUpdate: unref(isUpdate), values: { ...values, id: rowId.value } });
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  

</script>
