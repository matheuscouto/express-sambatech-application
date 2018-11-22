# express-sambatech-application

A express back-end for my sambatech application.

## Getting Started

First make sure you meet the requirements below.

### Prerequisites

#### Node

You need to have Node 8.10.0 or later on your local machine to run it. I'm personally using 8.12.0.

### Installing

Now, clone this repository.

```
git clone https://github.com/matheuscouto/express-sambatech-application.git
```

Then go into the projects folder and install the dependencies.

```
cd express-sambatech-application
npm install
```

#### Firebase, Zencode and S3 credentials

To run this application you must have your own credentials in each one of these services. Then, create a **config.ts** at:

```
/app/config.ts
```

It should contain all three informations like this:


```
export const encoderApiKey = 'XXXXXXXXXXXXXXXXXX';

export const s3BucketName = 'my-bucket-name';

export const firebaseServiceAccount = {
  projectId: "my-cool-application",
  privateKey: "-----BEGIN PRIVATE KEY-----\XXXXXXXXXXXXXXXXXX\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-qbz0f@my-cool-application.iam.gserviceaccount.com",
}

export const databaseURL = "https://my-cool-application.firebaseio.com";
```
_if you have any problems to generate your credential, please contact me so I can help you with that_

#### AWS credentials

If you already have it set in your env, you can skip this step. If now, create a **awsConfig.json** at the path below:

```
/app/awsConfig.json
```

And place your AWS credentials there, it should look like this:

```
{
  "accessKeyId": "XXXXXXXXXXXXXXX",
  "secretAccessKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

Then go to the awsUploadS3.ts at _app/utils/awsUploadS3.ts_ and uncomment the 11th line, it contains:
```
// this.s3.config.loadFromPath('../awsConfig.json');
```

### Building and starting

After that, generate your build folder with the following command:

```
npm run tsc 
```

And, at the root project folder, run:

```
node build/server.js
```


## Authors

* **Matheus Couto**

