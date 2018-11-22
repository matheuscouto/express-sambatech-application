import { Router, Request, Response } from 'express';
import multer  from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path'
import axios from 'axios';
import { AmazonService } from '../utils/awsUploadS3';
import { encoderApiKey, s3BucketName } from '../config';
import { IZencodeReponse } from '../declarations';
import { FirebaseDatabase, firebaseLog, getNextStep } from '../utils/firebase';

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
  
  const stepLog = firebaseLog(videoId);
  stepLog({job: 'client-upload', success: true, nextJob: getNextStep('client-upload')});

  /***** STATUS: UPLOADING TO S3 ****/

  let updates: any = {};
  updates[`/videos/${videoId}/name`] = req.body.name;
  updates[`/videos/${videoId}/status`] = 'uploading';
  updates[`/videos/${videoId}/rawFormat`] = rawFormat;
  FirebaseDatabase().ref().update(updates);

  amazonService.sendS3(req.file.path).then(() => {
    stepLog({job: 's3-raw-upload', success: true, nextJob: getNextStep('s3-raw-upload')});
    
    fs.unlink(req.file.path, (err) => {
      if (err) throw err;
    });

    /***** STATUS: ENCODING ****/

    const rawVideoPath = `${bucketPath}/${req.file.filename}`;

    let updates: any = {};
    updates[`/videos/${videoId}/raw`] = rawVideoPath; 
    updates[`/videos/${videoId}/status`] = 'encoding';
    FirebaseDatabase().ref().update(updates);

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
      stepLog({job: 'encode', success: true, nextJob: getNextStep('encode')});

      /***** STATUS: DONE ****/
      let updates: any = {};
      updates[`/videos/${videoId}/high`] = zencodeResponse.data.outputs[0].url;
      updates[`/videos/${videoId}/low`] = zencodeResponse.data.outputs[1].url;
      updates[`/videos/${videoId}/thumbnails`] = [
        `https://${s3BucketName}.s3.amazonaws.com/videos/${videoId}/thumbnails/frame_0000.png`,
        `https://${s3BucketName}.s3.amazonaws.com/videos/${videoId}/thumbnails/frame_0001.png`,
        `https://${s3BucketName}.s3.amazonaws.com/videos/${videoId}/thumbnails/frame_0002.png`,
      ];
      updates[`/videos/${videoId}/creationTime`] = Date.now();
      updates[`/videos/${videoId}/creationTimeOrder`] = Date.now() * -1;
      updates[`/videos/${videoId}/status`] = 'done';

      FirebaseDatabase().ref('/videosCount').once('value').then((videosCountSnapshot) => {
        if(!videosCountSnapshot.val()) {
          updates[`/videosCount`] = 1;
        } else {
          updates[`/videosCount`] = videosCountSnapshot.val() + 1;
        }

        setTimeout(() =>
          FirebaseDatabase().ref().update(updates).then(() => {
  
            /***** SAVED IN FIREBASE ****/
            res.status(200);
            res.send('Success');
  
          }).catch((firebaserError) => {
            res.status(500);
            res.send(firebaserError)
          }), 30000)
          
      }).catch((firebaserError) => {
        res.status(500);
        res.send(firebaserError)
      })
    }).catch((zencoderError) => {
      stepLog({job: 'encode', success: true, nextJob: getNextStep('encode')});

      let updates: any = {};
      updates[`/videos/${videoId}/failedReason`] = zencoderError;
      updates[`/videos/${videoId}/status`] = 'failed';
      FirebaseDatabase().ref().update(updates)

      res.status(500);
      res.send(zencoderError)
    })
  }).catch((s3Error) => {
    stepLog({job: 's3-raw-upload', success: false, error: s3Error});

    let updates: any = {};
    updates[`/videos/${videoId}/failedReason`] = s3Error;
    updates[`/videos/${videoId}/status`] = 'failed';
    FirebaseDatabase().ref().update(updates)

    res.status(500);
    res.send(s3Error)
  })
});

export const UploadController: Router = router;