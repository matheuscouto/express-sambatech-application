import { Router, Request, Response } from 'express';
import multer  from 'multer';
import crypto from 'crypto';

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

router.post('/', upload.single('img'), async (req: Request, res: Response) => {
  
    res.send(`File path: ${req.file.path} and Filename ${req.file.filename}`);
});


export const UploadController: Router = router;