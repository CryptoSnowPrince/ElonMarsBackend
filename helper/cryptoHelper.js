import crypto from "crypto";

// Encrypt data before sending
export function encryptData(data) {

  let str_data = JSON.stringify(data);

  const key = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPT_KEY)
  .digest('hex')
  .substring(0, 32)

const encryptionIV = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPT_KEY_IV)
  .digest('hex')
  .substring(0, 16)
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, encryptionIV)
  return Buffer.from(
    cipher.update(str_data, 'utf8', 'hex') + cipher.final('hex')
  ).toString('base64') // Encrypts data and converts to hex and base64

}

// Decrypt received data
export function decryptData(encryptedData) {

  const key = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPT_KEY)
  .digest('hex')
  .substring(0, 32)

  const encryptionIV = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPT_KEY_IV)
  .digest('hex')
  .substring(0, 16)
  
  const buff = Buffer.from(encryptedData, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, encryptionIV)
  let decrypted = (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  ) // Decrypts data and converts to utf8

  let obj_data = JSON.parse(decrypted);
  

  return obj_data;
}