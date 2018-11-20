import { Router, Request, Response } from 'express';
import multer  from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { AmazonService } from '../utils/awsUploadS3';

const amazonService = new AmazonService();

const router: Router = Router();

const storage = multer.diskStorage({
  destination: './temp/',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err, file.originalname)
      cb(null, file.originalname)
    })
  }
})

const upload = multer({ storage: storage })

router.post('/', upload.single('video'), async (req: Request, res: Response) => {
  amazonService.sendS3(req.file.path).then((awsFile) => {
    fs.unlink(req.file.path, (err) => {
      if (err) throw err;
    });
    res.status(200);
    res.send(`Aws file payload: ${JSON.stringify(awsFile)}`);
  }).catch((s3Error) => {
    res.status(500);
    res.send(s3Error)
  })
});

export const UploadController: Router = router;