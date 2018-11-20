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