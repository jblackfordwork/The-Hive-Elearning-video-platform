import { HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';

const checkSchoolAccount = (event) => {
  const user = event.data;
  if (event.additionalUserInfo?.providerId !== 'google.com' || !user?.emailVerified || !/^[^@\s]+@(students\.geneseeisd\.org|geneseeisd\.org)$/i.test(user.email || '')) {
    throw new HttpsError('permission-denied', 'HIVE_DOMAIN_NOT_ALLOWED: Please sign in with your Genesee ISD student or staff account.');
  }
};
export const restrictAccountCreation = beforeUserCreated(checkSchoolAccount);
export const restrictSignIn = beforeUserSignedIn(checkSchoolAccount);
