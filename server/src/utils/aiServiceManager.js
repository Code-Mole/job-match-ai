// import axios from "axios";

// const AI_URL = process.env.AI_SERVICE_URL;

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// /**
//  * Wake AI service
//  */
// export async function wakeAiService() {
//   const MAX_TRIES = 10;
//   const INTERVAL = 15000;

//   console.log(`🔄 Waking AI service at ${AI_URL}`);

//   for (let i = 1; i <= MAX_TRIES; i++) {
//     try {
//       const { data } = await axios.get(`${AI_URL}/health`, {
//         timeout: 120000,
//       });

//       if (data.status === "ok") {
//         console.log(`✅ AI service awake`);
//         return true;
//       }
//     } catch (err) {
//       console.log(`⏳ AI service sleeping (${i}/${MAX_TRIES})`);

//       await sleep(INTERVAL);
//     }
//   }

//   console.warn("⚠️ AI service failed to wake");
//   return false;
// }

// /**
//  * Keep AI service alive
//  */
//   let interval;

//   /**
//    * Starts background keep-alive ping to AI service
//    */
//   export const startAiKeepAlive = () => {
//     // immediate warm-up on server start
//     wakeAiService().catch(() => {});

//     // periodic keep-alive ping
//     interval = setInterval(
//       () => {
//         wakeAiService().catch(() => {});
//       },
//       4 * 60 * 1000,
//     ); // every 4 minutes
//   };

//   /**
//    * Stops the keep-alive interval (for graceful shutdown)
//    */
//   export const stopAiKeepAlive = () => {
//     if (interval) {
//       clearInterval(interval);
//       interval = null;
//     }
//   };

// // export function keepAiAlive() {
// //   setInterval(
// //     async () => {
// //       try {
// //         await axios.get(`${AI_URL}/health`, {
// //           timeout: 10000,
// //         });

// //         console.log("🤖 AI keepAlive ping success");
// //       } catch (err) {
// //         console.error("❌ AI keepAlive failed");
// //       }
// //     },
// //     10 * 60 * 1000,
// //   );
// // }
