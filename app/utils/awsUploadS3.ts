
import * as AWS from 'aws-sdk';
import { IAmazonFile } from '../declarations';
import { s3BucketName } from '../config'

export class AmazonService {
  private s3: any;

  constructor() {
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  }

  async sendS3(file: string): Promise<IAmazonFile> {

    const fs = require('fs');
    const fileStream = fs.createReadStream(file);

    const path = require('path');

    const uploadParams = {
      Body: fileStream,
      Key: path.basename(file),
      Bucket: s3BucketName,
      ACL: 'public-read',
    };
    
    return new Promise<IAmazonFile>((resolve, reject) => {
      this.s3.upload(uploadParams, (err: any, data: any) => {
        if (err) return reject(err);
        return resolve(data);
      });
    });
  }
}
