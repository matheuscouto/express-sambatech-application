import { Router, Request, Response } from 'express';
import multer  from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path'
import axios from 'axios';
import { AmazonService } from '../utils/awsUploadS3';
import { encoderApiKey, s3BucketName } from '../config';
import { IZencodeReponse } from '../declarations';
import { FirebaseDatabase } from '../utils/firebase';

const amazonService = new AmazonService();

const router: Router = Router();

const storage = multer.diskStorage({
  destination: './temp/',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      const newVideoKey = FirebaseDatabase().ref().child('videos').push().key;
      if (err) return cb(err, file.originalname)
      cb(null, newVideoKey + path.extname(file.originalname))
    })
  }
})

const upload = multer({ storage: storage })

router.post('/', upload.single('video'), async (req: Request, res: Response) => {
  const bucketPath = `s3://${s3BucketName}`;
  const [videoId, rawFormat] = req.file.filename.split('.');

  amazonService.sendS3(req.file.path).then(() => {
    fs.unlink(req.file.path, (err) => {
      if (err) throw err;
    });
    const rawVideoPath = `${bucketPath}/${req.file.filename}`;
    axios.post("https://app.zencoder.com/api/v2/jobs", {
      "test": true,
      "input": rawVideoPath,
      "outputs": [
        {
          "label": "mp4 high",
          "url": `${bucketPath}/videos/${videoId}/high/${videoId}.mp4`,
          "h264_profile": "high",
          "public": true
        },
        {
          "url": `${bucketPath}/videos/${videoId}/low/${videoId}.mp4`,
          "label": "mp4 low",
          "size": "640x480",
          "public": true,
          "thumbnails": {
            "number": 1,
            "public": true,
            "base_url": `${bucketPath}/videos/${videoId}/thumbnails/`
          },
        }
      ]
    }, {
      headers: {
        "Zencoder-Api-Key": encoderApiKey,
        "Content-Type": "application/json"
      }
    }).then((zencodeResponse: IZencodeReponse) => {
      res.status(200);
      res.send(zencodeResponse.data)
    }).catch((zencoderError) => {
      res.status(500);
      res.send(zencoderError)
    })
  }).catch((s3Error) => {
    res.status(500);
    res.send(s3Error)
  })
});

export const UploadController: Router = router;