import firebase from "firebase-admin";
import  { firebaseServiceAccount, databaseURL } from "../config";

firebase.initializeApp({
  credential: firebase.credential.cert(firebaseServiceAccount),
  databaseURL
});

export const FirebaseDatabase = firebase.database;