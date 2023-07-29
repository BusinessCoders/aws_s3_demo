import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import B2 from 'backblaze-b2';
import crypto from 'node:crypto';
import sharp from 'sharp';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// const s3 = new S3Client({
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIARDFHZCTSFLETC3G4",
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
//     },
//     region: process.env.AWS_BUCKET_REGION || 'us-east-2'
// });

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

router.post('/', upload.single('image'), async (req, res) => {
    console.log("req.body", req.body);
    console.log('req.file', req.file);

    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ,
        },
        region: process.env.AWS_BUCKET_REGION
    });
    
    const imageName = randomImageName(32)

    const imageBuffer = await sharp(req.file.buffer).resize({ height: 1920, width: 1080, fit: "contain" }).toBuffer();
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName,
        Body: imageBuffer,
        ContentType: req.file.mimetype
    }

    const command = new PutObjectCommand(params);
    const data = {
        caption: req.body.caption,
        imageName
    }

    const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "a4715b0340f4260b38a9bfb9aeda833b7f500e6837f3ee09f3352bdf15ab6ad4"
    }

    await s3.send(command);
    const getCommand = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
    res.status(200).json({
        success: true,
        data,
        url
    });
});

router.get('/', async (req, res) => {
    const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "a4715b0340f4260b38a9bfb9aeda833b7f500e6837f3ee09f3352bdf15ab6ad4"
    }
    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_BUCKET_REGION
    });
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log(url);

    res.status(200).json({
        success: true,
        url
    });
});

router.delete('/:id', async (req, res) => {
    console.log(req.params.id);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.params.id
    }
    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_BUCKET_REGION
    });
    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    res.status(200).json({
        success: true
    });
});

// create B2 object instance
// const b2 = new B2({
//     applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID, // or accountId: 'accountId'
//     applicationKey: process.env.BACKBLAZE_APP_KEY,
// });

// router.post('/', upload.single('image'), async (req, res) => {
//     console.log("req.body", req.body);
//     console.log('req.file', req.file);

//     await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
//         console.log("I am here");
//         let response = await b2.getBucket({
//             bucketName: process.env.BACKBLAZE_BUCKET_NAME,
//     });
//     console.log(response);

//     console.log(process.env.BACKBLAZE_APP_KEY_ID);
//     console.log(process.env.BACKBLAZE_APP_KEY);
//     res.status(200).json({
//         success: true,
//         image: true
//     });
// });

export default router;