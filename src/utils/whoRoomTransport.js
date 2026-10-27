/* ----------------------------------------------------------------------------
   WHO AM I, EVERYONE ON THEIR OWN PHONE: shared room
   ----------------------------------------------------------------------------
   Moved as-is from the card-games site: the same Firebase project, the same room
   path, so it behaves exactly as it did there. The Firebase library is loaded from
   Google's servers the first time someone opens this mode, so the rest of the app
   does not depend on it.

   Small interface the game screen uses:
     peers()          everyone in my room, each with a `presence` object
     presence(patch)  change what I show to the room (null removes a field)
     onPeers(fn)      called whenever anyone in the room changes
     onConnection(fn) called when the connection comes or goes
     connected()      true while the connection is up
---------------------------------------------------------------------------- */

const FB_CONFIG = {
  apiKey: "AIzaSyDPyCNI4MQMgb1kfvEaQFK5Ss86bq8t_4A",
  authDomain: "whist-45d5e.firebaseapp.com",
  databaseURL: "https://whist-45d5e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whist-45d5e",
  storageBucket: "whist-45d5e.firebasestorage.app",
  messagingSenderId: "415893241295",
  appId: "1:415893241295:web:937158fd82c89283e8e6ba",
};

function loadScript(src) {
  return new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = ok;
    s.onerror = () => no(new Error("load failed"));
    document.head.appendChild(s);
  });
}

async function loadFirebase() {
  await loadScript("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js");
  return window.firebase;
}

function buildTransport(fb) {
  const db = fb.initializeApp(FB_CONFIG, "salon-app").database();
  const myId = "p" + Math.random().toString(36).slice(2, 10);
  let code = null,
    roomRef = null,
    myRef = null,
    onVal = null,
    mine = {},
    remote = {},
    conn = false;
  const peerL = new Set(),
    connL = new Set();
  const notify = () => {
    const ch = { peers: T.peers(), joined: [], left: [], updated: [] };
    peerL.forEach((f) => f(ch));
  };
  const fail = (e) => {
    T.error = (e && e.code) || "error";
    notify();
  };
  const write = () => {
    if (myRef) myRef.set(Object.assign({}, mine)).catch(fail);
  };
  const detach = () => {
    if (roomRef && onVal) roomRef.off("value", onVal);
    onVal = null;
    if (myRef) {
      myRef.onDisconnect().cancel();
      myRef.remove().catch(() => {});
    }
    code = null;
    roomRef = null;
    myRef = null;
    remote = {};
  };
  const join = (c) => {
    detach();
    code = c;
    roomRef = db.ref("salon/rooms/" + c + "/players");
    myRef = roomRef.child(myId);
    onVal = (snap) => {
      remote = snap.val() || {};
      notify();
    };
    roomRef.on("value", onVal, fail);
    if (conn) myRef.onDisconnect().remove();
    write();
  };
  const T = {
    error: "",
    connected: () => conn,
    peers() {
      if (!code) return [];
      const all = Object.assign({}, remote, { [myId]: mine });
      return Object.keys(all)
        .sort()
        .map((id) => ({
          peer: id,
          isMe: id === myId,
          sameTab: id === myId,
          kind: "viewer",
          guest: false,
          by: null,
          presence: Object.freeze(Object.assign({}, all[id])),
          updatedAt: 0,
        }));
    },
    onPeers(fn) {
      peerL.add(fn);
      return () => peerL.delete(fn);
    },
    onConnection(fn) {
      connL.add(fn);
      fn(conn);
      return () => connL.delete(fn);
    },
    presence(patch) {
      for (const k of Object.keys(patch)) {
        if (patch[k] === null) delete mine[k];
        else mine[k] = patch[k];
      }
      if (typeof patch.code === "string" && patch.code !== code) join(patch.code);
      else if (patch.code === null) detach();
      else write();
      notify();
      return Promise.resolve();
    },
  };
  // Firebase drops the connection when a phone sleeps; when it is back, put this player back in the room.
  db.ref(".info/connected").on("value", (s) => {
    conn = !!s.val();
    if (conn && myRef) {
      myRef.onDisconnect().remove();
      write();
    }
    connL.forEach((f) => f(conn));
  });
  return T;
}

let cached = null;

// One connection for the whole visit, created the first time it is needed.
export function getRoomTransport() {
  if (!cached) {
    cached = loadFirebase()
      .then((fb) => buildTransport(fb))
      .catch((e) => {
        cached = null; // let the next visit to this screen try again
        throw e;
      });
  }
  return cached;
}
