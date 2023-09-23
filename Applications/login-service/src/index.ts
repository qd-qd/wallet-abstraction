import "dotenv/config";
import { ethers } from "ethers";
import HTTPServer from "moleculer-web";
import { ServiceBroker } from "moleculer";

const signer = new ethers.Wallet(process.env.LOGIN_SERVICE_PK);
const broker = new ServiceBroker();

broker.createService({
  name: "gateway",
  mixins: [HTTPServer],

  settings: {
    port: process.env.LOGIN_SERVICE_PORT ?? 4340,
    routes: [
      {
        aliases: {
          "POST /login": "login.test",
        },
        cors: {
          origin: "*",
        },
        bodyParsers: {
          json: true,
          urlencoded: { extended: true },
        },
      },
    ],
  },
});

enum SignatureTypes {
  NONE,
  WEBAUTHN_UNPACKED,
  LOGIN_SERVICE,
  WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
}

// Define a service
broker.createService({
  name: "login",
  actions: {
    async test(ctx) {
      const { login, credId, pubKeyCoordinates } = ctx.params;

      const message = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes1", "string", "bytes", "uint256[2]"],
          [SignatureTypes.LOGIN_SERVICE, login, credId, pubKeyCoordinates]
        )
      );
      const signature = await signer.signMessage(Buffer.from(message.slice(2), "hex"));
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["bytes1", "string", "bytes", "uint256[2]", "bytes"],
        [SignatureTypes.LOGIN_SERVICE, login, credId, pubKeyCoordinates, signature]
      );
      console.log({ message, messageHashed: ethers.utils.hashMessage(message), signature, payload });
      return payload;
    },
  },
});

broker.start();
