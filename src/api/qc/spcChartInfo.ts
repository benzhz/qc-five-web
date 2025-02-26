import { defHttp } from '@/utils/http/axios';



enum Api {
  getSpcChartInfo = '/spc/info/getChartInfo',
}


export const getSpcChartList =(params)=>{
  return defHttp.get({ url: Api.getSpcChartInfo,params});
};
