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
    if (ctx.resume) ctx.resume();
    // three short beeps: "time is up"
    [0, 0.28, 0.56].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const at = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
      gain.gain.setValueAtTime(0.25, at + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      osc.start(at);
      osc.stop(at + 0.22);
    });
    setTimeout(() => { try { ctx.close(); } catch (e) { /* closed */ } }, 1200);
  } catch (e) {
    /* no sound available */
  }
}

/* Plays the end beep once, when a running countdown reaches zero. */
export function useEndBeep(timeLeft, enabled = true) {
  const prev = useRef(timeLeft);
  useEffect(() => {
    if (enabled && prev.current > 0 && timeLeft === 0) beep();
    prev.current = timeLeft;
  }, [timeLeft, enabled]);
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
