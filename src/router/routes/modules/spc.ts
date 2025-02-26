import type { AppRouteModule } from '@/router/types';

import { getParentLayout, LAYOUT } from '@/router/constant';
import { t } from '@/hooks/web/useI18n';

const comp: AppRouteModule = {
  path: '/qc',
  name: 'QC',
  component: LAYOUT,
  redirect: '/comp/basic',
  meta: {
    orderNo: 30,
    icon: 'ion:layers-outline',
    title: '质量管理',
  },

  children: [
    {
      path: 'spcChart',
      name: 'spcChart',
      component: () => import('@/views/qc/spc/SpcChart.vue'),
      meta: {
        title: 'SPC',
      },
    },
  ],
};

export default comp;
