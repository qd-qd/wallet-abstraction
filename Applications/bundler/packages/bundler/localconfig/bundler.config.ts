export default {
  gasFactor: "1",
  port: process.env.BUNDLER_PORT,
  network: process.env.RPC,
  unsafe: Boolean(process.env.BUNDLER_UNSAFE),
  entryPoint: process.env.ENTRYPOINT_CONTRACT,
  privateKey: process.env.BUNDLER_PK,
  beneficiary: process.env.BUNDLER_BENEFICIARY,
  minBalance: process.env.BUNDLER_MIN_BALANCE,
  maxBundleGas: 5e6,
  minStake: process.env.BUNDLER_MIN_STAKE,
  minUnstakeDelay: 0,
  autoBundleInterval: 3,
  autoBundleMempoolSize: 10
};
