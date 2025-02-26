<template>
  <div class="m-4 mr-0 overflow-hidden bg-white">
    <BasicTree
      ref="treeRef"
      title="SPC控制图列表"
      toolbar
      search
       v-model:selected-keys="selectedKeys"
      defaultExpandLevel="1"
      defaultExpandAll
      treeWrapperClassName="h-[calc(100%-35px)] overflow-auto"
      :clickRowToExpand="true"
      :treeData="treeData"
      :actionList="actionList"
      :fieldNames="{ key: 'id', title: 'label' }"
      @select="handleSelect"
    />
  </div>
  <ChartModal @register="registerModal" @success="handleSuccess" />
</template>
<script lang="ts" setup>
  import { onMounted, ref,unref} from 'vue';

  import { BasicTree, TreeItem,TreeActionItem,TreeActionType } from '@/components/Tree';
  import { saveSpcChart,getSpcChartList,updateSpcChart ,delSpcChart} from '@/api/qc/spc';
  import { h } from 'vue';
  import { useModal } from '@/components/Modal';
  import ChartModal from './ChartModal.vue';
  import { useMessage } from '@/hooks/web/useMessage';

  import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons-vue';

  defineOptions({ name: 'DeptTree' });

  const emit = defineEmits(['select']);

  const [registerModal, { openModal }] = useModal();
  const { createMessage } = useMessage();
  const selectedKeys = ref<string[]>([]);

  let currentNode ;

  const treeData = ref<TreeItem[]>([]);
  function handlePlus(node: any) {
    openModal(true, {
      isUpdate: false,
    });
  }

  function handleDel(node :any){
    delSpcChart({id:node.id}).then((res)=>{
       getTree().deleteNodeByKey(node.id);
       createMessage.success("删除成功")
    }).catch ((error)=> {
      createMessage.error("删除失败:"+error);
    })
  }

  function handleEdit(node :any){
    openModal(true, {
      record: node,
      isUpdate: true,
    });
  }

  function handleSuccess({ isUpdate, values }) {
    if (isUpdate) {
      updateSpcChart(values).then((res)=>{
        values['label']= values.name;
        getTree().updateNodeByKey(currentNode.id, values);
        createMessage.success("更新成功")
      }).catch ((error)=> {
      createMessage.error("更新失败:"+error);
    })
    } else {
      values['parentId']= currentNode.id;
      saveSpcChart(values).then((res)=>{
        values['label']= values.name;
        values['id'] = res.id;
        getTree().insertNodeByKey({
              parentKey: currentNode.id,
              node: values,
              // 往后插入
              push: 'push',
              // 往前插入
              // push:'unshift'
            });
            createMessage.success("新增成功")
      }).catch ((error)=> {
      createMessage.error("新增失败:"+error);
    })
    }
  }

  const treeRef = ref<Nullable<TreeActionType>>(null);

  
  function getTree() {
    const tree = unref(treeRef);
    if (!tree) {
      throw new Error('tree is null!');
    }
    return tree;
  }


  const actionList: TreeActionItem[] = [
    {
      // show:() => boolean;
      render: (node) => {
        return h(PlusOutlined, {
          class: 'ml-2',
          onClick: (event: MouseEvent) => {
            currentNode = node;
            event.stopPropagation();
            handlePlus(node);
            getTree().setSelectedKeys([node.id]);
          },
        });
      },
    },
    {
      render: (node) => {
        if(node.parentId){
          return h(EditOutlined,{
            onClick: (event: MouseEvent) => {
              currentNode = node;
              event.stopPropagation();
              handleEdit(node);
              getTree().setSelectedKeys([node.id]);
            },
          });
        }
      },
    },
    {
      render: (node) => {
        if(node.parentId){
          return h(DeleteOutlined,{
            onClick: () => {
              currentNode = node;
              handleDel(node);
            },
          });
        }
      },
    },
  ];

  async function fetch() {
    treeData.value = (await getSpcChartList()) as unknown as TreeItem[];
  }

  function handleSelect(keys) {
    var node = getTree().getSelectedNode(keys[0]);
    emit('select', node);
  }

  onMounted(() => {
    fetch();
    setTimeout(() => {
      getTree().expandAll(true);
    }, 100);
  
  });
</script>
