"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Check, Lock } from "lucide-react";

const SEEN_KEY = "libbie.tour.seen.v1";

export function hasSeenTour() {
  try {
    return localStorage.getItem(SEEN_KEY) === "yes";
  } catch {
    return true; // storage blocked: never nag
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "yes");
  } catch {
    /* private window or blocked storage: the tour simply shows again */
  }
}

const steps = [
  {
    title: "See the mistake",
    lede: "Libbie reads this conversation wrong. The word “selling” is in the message, so it latched on and ignored the “not”.",
    note: "Everything starts from a real failure you can point at.",
  },
  {
    title: "Correct it, with evidence",
    lede: "You fix the field, pick the message that proves it, and say why. The brief is right from now on.",
    note: "The correction is not a patch. It is saved as a case the system must get right in future.",
  },
  {
    title: "Measure the candidate",
    lede: "Both versions replay the identical saved conversations. You get what the change fixed — and what it broke.",
    note: "“Cases broken” is the number that matters. It catches a fix that quietly costs you something else.",
  },
  {
    title: "Sign off on the answers",
    lede: "Before anything ships, a person states what the right answer actually was. Each case is pre-filled with what today’s version says.",
    note: "An amber dot marks every case where the two versions disagree. Do not wave those through.",
  },
  {
    title: "The gate does its job",
    lede: "Sign off the wrong answer and the release is blocked, not hidden. Correct it and the release clears.",
    note: "The system would rather block a good fix than let you quietly approve a bad answer.",
  },
  {
    title: "Release it, and keep the receipt",
    lede: "Every version change records who decided, why, and the exact comparison it was based on. One click undoes it.",
    note: "A mistake became a test, the test became evidence, the evidence became a decision you can reverse.",
  },
];

// The beats animate with CSS keyframes rather than Motion variants. Inside
// AnimatePresence the variant lookup did not re-resolve on remount and panels
// mounted stuck at their hidden state; a keyframe always runs on mount.
function Beat({ i, children }: { i: number; children: any }) {
  return (
    <div
      className="tour-beat"
      style={{ animationDelay: 0.08 + i * 0.12 + "s" }}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix }: { to: number; suffix?: string }) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 620);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      {n}
      {suffix && <small>{suffix}</small>}
    </>
  );
}

function Screen({ step }: { step: number }) {
  if (step === 0)
    return (
      <>
        <Beat i={0}>
          <div className="tour-bubble">
            <span>Client · simulated WhatsApp</span>
            <p>
              We are <mark>not selling</mark>. We need to rent a four-bedroom
              house in Mudon, up to 450k a year.
            </p>
          </div>
        </Beat>
        <Beat i={1}>
          <div className="tour-card">
            <h4>The lead brief</h4>
            <dl className="tour-rows">
              <dt>Intent</dt>
              <dd>
                <span className="tag amber">Seller</span>
              </dd>
              <dt>Stage</dt>
              <dd>Qualifying</dd>
              <dt>Budget</dt>
              <dd>AED 450,000 / year</dd>
            </dl>
          </div>
        </Beat>
        <Beat i={2}>
          <p className="tour-caution">
            <b>Wrong.</b> A broker reading this loses the lead, or spends a week
            on the wrong pitch.
          </p>
        </Beat>
      </>
    );

  if (step === 1)
    return (
      <>
        <Beat i={0}>
          <div className="tour-card">
            <h4>Correct with evidence</h4>
            <dl className="tour-rows">
              <dt>Field</dt>
              <dd className="mono">clientType</dd>
              <dt>Value</dt>
              <dd>
                <span className="tour-swap">
                  <span className="was">Seller</span>
                  <span className="now">Renter</span>
                </span>
              </dd>
              <dt>Source</dt>
              <dd className="quietrow">
                “We are not selling. We need to rent…”
              </dd>
              <dt>Reason</dt>
              <dd className="quietrow">
                Client explicitly rules out selling in the first message.
              </dd>
            </dl>
          </div>
        </Beat>
        <Beat i={2}>
          <div className="tour-actions">
            <span className="tour-btn">Save human correction</span>
            <span className="tag green">
              <Check size={12} /> Saved as test case S13
            </span>
          </div>
        </Beat>
      </>
    );

  if (step === 2)
    return (
      <>
        <Beat i={0}>
          <p className="tour-meta">
            <b className="mono">v1</b> in use today → <b className="mono">v3</b>{" "}
            proposed · 13 saved conversations, replayed identically
          </p>
        </Beat>
        <Beat i={1}>
          <div className="tour-tiles">
            <div className="tour-tile">
              <small>CASES FIXED</small>
              <b>
                <Counter to={1} />
              </b>
              <i>wrong before, right now</i>
            </div>
            <div className="tour-tile">
              <small>CASES BROKEN</small>
              <b>
                <Counter to={0} />
              </b>
              <i>right before, wrong now</i>
            </div>
            <div className="tour-tile">
              <small>SIGNED OFF</small>
              <b>
                <Counter to={0} suffix=" / 13" />
              </b>
              <i>by a person</i>
            </div>
            <div className="tour-tile flag">
              <small>RELEASE STATUS</small>
              <b className="small">Needs human sign-off</b>
            </div>
          </div>
        </Beat>
        <Beat i={2}>
          <table className="tour-table">
            <tbody>
              <tr>
                <td>
                  <b className="mono">S12</b> No match means no match
                </td>
                <td>
                  <span className="tag green">Correct</span>
                </td>
                <td>
                  <span className="tag green">Correct</span>
                </td>
              </tr>
              <tr>
                <td>
                  <b className="mono">S13</b> Not selling, looking to rent
                </td>
                <td>
                  <span className="tag amber">Wrong</span>
                </td>
                <td>
                  <span className="tag green">Correct</span>
                </td>
              </tr>
            </tbody>
          </table>
        </Beat>
      </>
    );

  if (step === 3)
    return (
      <>
        <Beat i={0}>
          <div className="tour-queue">
            {Array.from({ length: 13 }, (_, k) => {
              const id = "S" + String(k + 1).padStart(2, "0");
              const open = k === 12;
              return (
                <span
                  key={id}
                  className={"tour-chip " + (open ? "here" : "done")}
                  style={{ animationDelay: 0.15 + k * 0.07 + "s" }}
                >
                  <b>
                    {id}
                    {open && <i className="dot" />}
                  </b>
                  <i>{open ? "Not reviewed" : "Signed off"}</i>
                </span>
              );
            })}
          </div>
        </Beat>
        <Beat i={4}>
          <div className="tour-card">
            <h4>
              Your answer <span className="mono">S13</span>
            </h4>
            <dl className="tour-rows">
              <dt>Client intent</dt>
              <dd>
                <span className="tag amber">Seller</span>{" "}
                <span className="mono">pre-filled from v1</span>
              </dd>
            </dl>
          </div>
        </Beat>
        <Beat i={5}>
          <p className="tour-caution">
            The two versions <b>disagree</b> here. Sign off the wrong answer and
            you certify the bug.
          </p>
        </Beat>
      </>
    );

  if (step === 4)
    return (
      <>
        <Beat i={0}>
          <div className="tour-split">
            <div className="tour-outcome bad">
              <header>If you sign off “Seller”</header>
              <span className="tag amber">
                <Lock size={12} /> Blocked · the candidate broke a check
              </span>
              <p>The fix now contradicts your own reference. Release stops.</p>
            </div>
            <div className="tour-outcome good">
              <header>If you change it to “Renter”</header>
              <span className="tag green">Ready to release</span>
              <p>13 of 13 signed off. One fixed, none broken.</p>
            </div>
          </div>
        </Beat>
        <Beat i={2}>
          <p className="tour-meta">
            Either way the system says what it did and why.
          </p>
        </Beat>
      </>
    );

  return (
    <>
      <Beat i={0}>
        <div className="tour-actions">
          <span className="tag green">Ready to release</span>
          <span className="tour-btn">Make v3 the live version</span>
        </div>
      </Beat>
      <Beat i={1}>
        <ol className="tour-timeline">
          <li>
            <span className="mono">2026-09-18 12:42</span>
            <b>v1 → v3</b>
            <p>Broker reviewed the comparison and accepted the change</p>
            <small>by local broker · evidence 43b0d8a6</small>
          </li>
          <li className="undo tour-late">
            <span className="mono">2026-09-18 12:44</span>
            <b>v3 → v1</b>
            <p>Explicit rollback</p>
            <small>by local broker · both entries kept</small>
          </li>
        </ol>
      </Beat>
      <Beat i={3}>
        <p className="tour-meta">Nothing is erased. Ever.</p>
      </Beat>
    </>
  );
}

export function Tutorial({
  open,
  onClose,
  onFinish,
}: {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}) {
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setI((n) => Math.min(steps.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    markSeen();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="tour" aria-describedby={undefined}>
          <div className="tour-head">
            <div>
              <span className="eyebrow">HOW LIBBIE GETS BETTER</span>
              <Dialog.Title>{steps[i].title}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="quiet icon-button" aria-label="Close the tour">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="tour-body">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={i}
                className="tour-screen"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Screen step={i} />
              </motion.div>
            </AnimatePresence>
            <div className="tour-copy">
              <p className="lede">{steps[i].lede}</p>
              <p className="tour-note">{steps[i].note}</p>
            </div>
          </div>

          <div className="tour-foot">
            <div className="tour-dots" role="tablist" aria-label="Tour steps">
              {steps.map((s, k) => (
                <button
                  key={s.title}
                  role="tab"
                  aria-selected={k === i}
                  aria-label={"Step " + (k + 1) + ": " + s.title}
                  className={k === i ? "on" : k < i ? "past" : ""}
                  onClick={() => setI(k)}
                />
              ))}
            </div>
            <span className="micro">
              Step {i + 1} of {steps.length}
            </span>
            <div className="tour-nav">
              <button
                className="secondary"
                disabled={i === 0}
                onClick={() => setI(i - 1)}
              >
                <ArrowLeft size={15} /> Back
              </button>
              {last ? (
                <button
                  onClick={() => {
                    markSeen();
                    onFinish();
                  }}
                >
                  Start the run <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={() => setI(i + 1)}>
                  Next <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
