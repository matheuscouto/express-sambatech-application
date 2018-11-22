export interface IAmazonFile {
  ETag: string;
  Location: string;
  key: string;
  Key: string;
  Bucket: string;
}

export interface IZencodeReponse {
  data: {
    id: number,
    outputs: Array<{ id: number, label: any, url: string }>
  }
}

export type IVideoSteps = 'client-upload' | 's3-raw-upload' | 'encode';

export interface IFirebaseLogProps {job: IVideoSteps, success: boolean, nextJob?: string, error?: string}
