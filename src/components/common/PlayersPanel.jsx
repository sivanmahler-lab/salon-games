import React, { useState, useEffect } from "react";
import { Users, X, UserMinus, ArrowLeft, DoorOpen } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { Btn, Avatar, QRCode } from "./UIComponents";

/* Players panel, available at any moment of the evening (host screen and host remote):
   - the join QR + room code, so someone can join late
   - hand the turn to a specific player (turn games)
   - remove a player
   - end the game / close the room */
export default function PlayersPanel({ room, dispatch, joinUrl, roomCode, gameKey, onBack, onExit, hideButton = false }) {
  const [open, setOpen] = useState(false);
  // On the host screen the button lives in the top bar ("הצג QR לחדר"), which opens this panel with an event.
  useEffect(() => {
    if (!hideButton) return undefined;
    const h = () => setOpen(true);
    window.addEventListener("salon-open-players", h);
    return () => window.removeEventListener("salon-open-players", h);
  }, [hideButton]);
  const [confirm, setConfirm] = useState(null);
  const g = gameKey ? room[gameKey] : null;
  const close = () => { setOpen(false); setConfirm(null); };

  return (
    <>
      {!hideButton && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-3 right-3 z-[65] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold"
          style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.text }}
        >
          <Users size={14} /> שחקנים / QR
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={close}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-3xl border p-5 md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="flex items-center justify-between">
              <div className="font-black" style={{ color: COLORS.text }}>שחקנים ({room.players.length})</div>
              <button onClick={close} className="rounded-full p-1.5" style={{ background: COLORS.surfaceAlt, color: COLORS.muted }}><X size={16} /></button>
            </div>

            <div className="flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center" style={{ borderColor: COLORS.border }}>
              <div className="text-xs font-bold" style={{ color: COLORS.amber }}>להצטרפות שחקן נוסף</div>
              <QRCode text={joinUrl} size={150} />
              <div className="rounded-xl border px-3 py-1 text-lg font-black tracking-widest" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{roomCode}</div>
            </div>

            <div className="flex flex-col gap-2">
              {room.players.map((p, i) => {
                const isTurn = g && g.turnIdx === i;
                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-2xl border p-2" style={{ borderColor: isTurn ? COLORS.amber : COLORS.border, background: COLORS.surfaceAlt }}>
                    <Avatar index={i} name={p.name} />
                    <div className="min-w-0 flex-1 text-right">
                      <div className="truncate text-sm font-bold" style={{ color: COLORS.text }}>{p.name}</div>
                      {isTurn && <div className="text-[11px] font-bold" style={{ color: COLORS.amber }}>התור שלו/ה עכשיו</div>}
                    </div>
                    {g && !isTurn && (
                      <button onClick={() => { dispatch({ type: "SET_TURN", game: gameKey, idx: i }); close(); }} className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold" style={{ background: `${COLORS.purple}33`, color: COLORS.purple }}>
                        <ArrowLeft size={13} /> העבר תור
                      </button>
                    )}
                    <button
                      onClick={() => (confirm === p.id ? (dispatch({ type: "LEAVE", id: p.id }), setConfirm(null)) : setConfirm(p.id))}
                      className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      style={{ background: confirm === p.id ? COLORS.coral : `${COLORS.coral}22`, color: confirm === p.id ? "#0b0f1a" : COLORS.coral }}
                    >
                      <UserMinus size={13} /> {confirm === p.id ? "בטוח/ה?" : "הוצא"}
                    </button>
                  </div>
                );
              })}
            </div>

            {onBack && <Btn full variant="ghost" onClick={() => { close(); onBack(); }}>סיום המשחק וחזרה למרכז</Btn>}
            {onExit && <Btn full variant="ghost" onClick={onExit}><DoorOpen size={16} /> סגירת החדר</Btn>}
          </div>
        </div>
      )}
    </>
  );
}
