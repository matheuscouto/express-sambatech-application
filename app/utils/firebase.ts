import firebase from "firebase-admin";
import  { firebaseServiceAccount, databaseURL } from "../config";
import { IVideoSteps, IFirebaseLogProps } from "../declarations";

firebase.initializeApp({
  credential: firebase.credential.cert(firebaseServiceAccount),
  databaseURL
});

export const FirebaseDatabase = firebase.database;

export function getNextStep(step: IVideoSteps):string {
  switch(step) {
    case 'client-upload':
      return 's3-raw-upload'; 
    case 's3-raw-upload':
      return 'encode'; 
    case 'encode':
      return 'finish'
    default:
      return 'unkown-step'
  }
}

export const firebaseLog = (videoId: string) => (props:IFirebaseLogProps):Promise<void> => {
  const newLogKey = firebase.database().ref().child('log').push().key;
  return firebase.database().ref(`/log/${newLogKey}`).set({
    videoId,
    time: Date.now(),
    ...props
  })
}