import crypto from 'crypto';
import CryptoJS from 'crypto-js';

export const generateCryptomusSignature = (data) => {
  const signString = [
    CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(data))),
    process.env.CRYPTOMUS_API_KEY
  ].join('');

  return crypto
    .createHash('md5')
    .update(signString)
    .digest('hex');
};

export const verifyCryptomusWebhook = (signHeader, requestBody) => {
  const dataString = JSON.stringify(requestBody);
  const signString = dataString + process.env.CRYPTOMUS_WEBHOOK_SECRET;
  
  const generatedSignature = crypto
    .createHash('md5')
    .update(signString)
    .digest('hex');

  return generatedSignature === signHeader;
};