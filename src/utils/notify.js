/* Push notification to the owner's phone (through ntfy.sh) when someone joins a room.
   To receive them: install the ntfy app and subscribe to the topic below.
   Anyone who knows the topic name could read these messages, so it is a long random name, and the
   messages only say who joined and which room. */

export const NTFY_TOPIC = "salon-sivan-wposfg2s0v";

export function notifyJoin(name, roomCode, playerCount) {
  if (!NTFY_TOPIC || typeof fetch === "undefined") return;
  const text = `${name} הצטרף/ה לחדר ${roomCode} (${playerCount === 1 ? "שחקן אחד" : `${playerCount} שחקנים`} עכשיו)`;
  // Plain text body and no custom headers, so the browser sends it without a preflight request.
  fetch(`https://ntfy.sh/${NTFY_TOPIC}`, { method: "POST", body: text }).catch(() => {});
}
