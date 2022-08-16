
const { createHmac, timingSafeEqual } = require("crypto");
const { Buffer } = require("buffer");
// Utility functions
const sign = async (secret, payload) => {
  if (!secret || !payload) {
    throw new TypeError("secret & payload required for sign()");
  }
  return `${createHmac("sha256", secret).update(payload).digest("hex")}`;
};
const verify = async (secret, eventPayload, signature) => {
  if (!secret || !eventPayload || !signature) {
    throw new TypeError("secret, eventPayload & signature required");
  }
  const signatureBuffer = Buffer.from(signature);
  const verificationSignature = await sign(secret, eventPayload);
  const verificationBuffer = Buffer.from(verificationSignature);
  if (signatureBuffer.length !== verificationBuffer.length) {
    return false;
  }
  // constant time comparison to prevent timing attachs
  // https://stackoverflow.com/a/31096242/206879
  // https://en.wikipedia.org/wiki/Timing_attack
  return timingSafeEqual(signatureBuffer, verificationBuffer);
};
const parseHeader = (header, scheme) => {
  if (typeof header !== "string") {
    return null;
  }
  return header.split(",").reduce(
    (accum, item) => {
      const kv = item.split("=");
      if (kv[0] === "t") {
        accum.timestamp = kv[1];
      }
      if (kv[0] === scheme) {
        accum.signature = kv[1];
      }
      return accum;
    },
    {
      timestamp: -1,
      signature: -1,
    }
  );
};

const verifyWebhook = async (response_body, abridge_signature, secret_key) => {
  try {
    // STEP 1: EXTRACT THE TIMESTAMP AND SIGNATURES FROM THE HEADER
    const parsedSignatureHeader = parseHeader(abridge_signature, "v1");
    if (!parsedSignatureHeader || parsedSignatureHeader.timestamp === -1) {
      throw "Unable to extract timestamp and signature from header";
    }
    if (!parsedSignatureHeader || parsedSignatureHeader.signature === -1) {
      throw "No signature found with expected scheme";
    }
    // Step 1.1 :: Check for timestamp tolreance of 5mins (Preventing replay attacks)
    if ((Date.now() - parsedSignatureHeader.timestamp) / (60 * 1000) > 15) {
      throw "Timestamp beyond expected tolreance";
    }
    // STEP 2: PREPARE THE SIGNED_PAYLOAD STRING
    const signed_payload = `${parsedSignatureHeader.timestamp}.${JSON.stringify(
      response_body
    )}`;
    // STEP 3 & 4: DETERMINE THE EXPECTED SIGNATURE & COMPARE THE SIGNATURES
    let d = await verify(secret_key, signed_payload, parsedSignatureHeader.signature);
    console.log("Valid Abridge-Signature :: ", d);
    return d;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

module.exports = {
    sign,
    verifyWebhook
};
