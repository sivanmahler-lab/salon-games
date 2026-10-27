import { useCallback, useEffect, useRef, useState } from "react";

/* Small helpers for the one-phone games: a countdown, keeping the screen awake, and the time-is-up beep. */

// A countdown. start(seconds, onEnd) runs it from the current moment; `left` is the whole seconds still to go.
// The clock follows the real time, so a phone that was busy for a moment does not fall behind.
export function useTimer() {
  const idRef = useRef(null);
  const [left, setLeft] = useState(0);

  const stop = useCallback(() => {
    clearInterval(idRef.current);
    idRef.current = null;
  }, []);

  const start = useCallback(
    (seconds, onEnd) => {
      stop();
      const end = Date.now() + seconds * 1000;
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        setLeft(remaining);
        if (remaining <= 0) {
          stop();
          onEnd();
        }
      };
      idRef.current = setInterval(tick, 250);
      tick();
    },
    [stop]
  );

  useEffect(() => stop, [stop]);
  return { left, start, stop };
}

// Keeps the phone screen from going dark during a turn. Quietly does nothing where the browser does not support it.
export function useWakeLock() {
  const ref = useRef(null);
  const keep = useCallback(async () => {
    try {
      ref.current = await navigator.wakeLock.request("screen");
    } catch (e) {
      /* not supported, or not allowed right now */
    }
  }, []);
  const release = useCallback(() => {
    try {
      if (ref.current) ref.current.release();
    } catch (e) {
      /* already released */
    }
    ref.current = null;
  }, []);
  useEffect(() => release, [release]);
  return { keep, release };
}

export function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.value = 0.2;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 400);
  } catch (e) {
    /* no sound available */
  }
}

export function lsGet(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    return "";
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* storage blocked */
  }
}
