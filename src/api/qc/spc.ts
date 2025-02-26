import { defHttp } from '@/utils/http/axios';
import { UploadFileParams } from '#/axios';
import { AxiosProgressEvent } from 'axios';


enum Api {
  SaveSpcChart = '/spc/saveOrUpdate',
  GetSpcChartList = '/spc/list',
  delSpcChart = '/spc/delete',
  importSpcChart = '/spc/import-data',
  
}
/**
 * @description: Upload interface
 */
export function uploadApi(
  uploadUrl : string,
  params: UploadFileParams,
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
) {
  return defHttp.uploadFile(
    {
      url: uploadUrl,
      onUploadProgress,
    },
    params,
  );
}

export const updateSpcChart = (params) => {
  return defHttp.post({ url: Api.SaveSpcChart,params});
};

export const saveSpcChart = (params) => {
  return defHttp.post({ url: Api.SaveSpcChart,params});
};

export const getSpcChartList =(params)=>{
  return defHttp.get({ url: Api.GetSpcChartList,params});
};

export const delSpcChart = (params) => {
  return defHttp.post({ url: Api.delSpcChart,params});
};

export const importSpcChart = (params) => {
  return defHttp.post({ url: Api.importSpcChart,params});
};