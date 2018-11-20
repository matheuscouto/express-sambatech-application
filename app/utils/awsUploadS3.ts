
import * as AWS from 'aws-sdk';

export interface AmazonFile {
  ETag: string;
  Location: string;
  key: string;
  Key: string;
  Bucket: string;
}

export class AmazonService {
  private s3: any;

  constructor() {
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  }

  async sendS3(file: string): Promise<AmazonFile> {

    const fs = require('fs');
    const fileStream = fs.createReadStream(file);

    const path = require('path');

    const uploadParams = {
      Body: fileStream,
      Key: path.basename(file),
      ACL: 'public-read',
    };
    
    return new Promise<AmazonFile>((resolve, reject) => {
      this.s3.upload(uploadParams, (err: any, data: any) => {
        if (err) return reject(err);
        return resolve(data);
      });
    });
  }
}
