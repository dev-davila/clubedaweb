"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, ArrowLeft, ArrowRight, Check, SkipForward, Wand2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeKey, WizardData, StepKey } from "./types";
import { STEPS, STEP_KEYS } from "./types";
import { dataForTheme, emptyWizardData } from "./defaults";
import { Step1Theme } from "./steps/step1-theme";
import { Step2Identity } from "./steps/step2-identity";
import { Step3Home } from "./steps/step3-home";
import { Step4Partners } from "./steps/step4-partners";
import { StepGoogle } from "./steps/step-google";
import { Step5Review } from "./steps/step5-review";

const OAUTH_PENDING_KEY = "wizard:oauth-pending";
const STATE_KEY = "wizard:state";

interface PersistedState {
  data: WizardData;
  stepIdx: number;
  visited: StepKey[];
}

export function WizardShell() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<WizardData>(emptyWizardData());
  const [visited, setVisited] = useState<Set<StepKey>>(new Set(["theme"]));
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [oauthReturn, setOauthReturn] = useState<{ success: boolean; error?: string } | null>(null);

  const step = STEPS[stepIdx];
  const canNext = useMemo(() => {
    if (step.key === "theme") return data.theme !== null;
    if (step.key === "identity") return data.identity.companyName.trim().length > 0;
    return true;
  }, [step, data]);

  // Restaura estado se voltou do OAuth do Google
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem(OAUTH_PENDING_KEY);
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (pending === "1") {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) {
        try {
          const parsed: PersistedState = JSON.parse(raw);
          setData(parsed.data);
          setVisited(new Set(parsed.visited));
          const googleIdx = STEP_KEYS.indexOf("google");
          setStepIdx(googleIdx >= 0 ? googleIdx : parsed.stepIdx);
        } catch {
          // ignora payload corrompido
        }
      }
      sessionStorage.removeItem(OAUTH_PENDING_KEY);
      sessionStorage.removeItem(STATE_KEY);

      if (success === "true") {
        setOauthReturn({ success: true });
      } else if (error) {
        setOauthReturn({ success: false, error });
      }

      // Limpa query params da URL
      if (success || error) {
        const url = new URL(window.location.href);
        url.searchParams.delete("success");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, []);

  function selectTheme(t: ThemeKey) {
    // Pré-preenche com defaults do tema
    setData(dataForTheme(t));
  }

  function next() {
    if (stepIdx < STEPS.length - 1) {
      const nextStep = STEPS[stepIdx + 1].key;
      setVisited((v) => new Set([...v, nextStep]));
      setStepIdx(stepIdx + 1);
    }
  }

  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function skip() {
    next();
  }

  function goTo(idx: number) {
    if (idx <= stepIdx || visited.has(STEPS[idx].key)) {
      setStepIdx(idx);
    }
  }

  function persistBeforeOAuth() {
    if (typeof window === "undefined") return;
    const payload: PersistedState = {
      data,
      stepIdx,
      visited: Array.from(visited),
    };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));
    sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
  }

  async function apply() {
    setApplying(true);
    // Visual only — fake delay
    await new Promise((r) => setTimeout(r, 1500));
    setApplied(true);
    setApplying(false);
    setTimeout(() => router.push("/"), 1800);
  }

  // ESC abandona wizard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/gestor");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
            <Wand2 size={16} className="text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-gray-900 tracking-tight">Configurar site</div>
            <div className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
              Wizard · etapa {stepIdx + 1} de {STEPS.length}
            </div>
          </div>
        </div>

        {/* Stepper horizontal */}
        <div className="hidden md:flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const isActive = i === stepIdx;
            const isDone = i < stepIdx || visited.has(s.key);
            const clickable = i <= stepIdx || visited.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => clickable && goTo(i)}
                disabled={!clickable}
                className="flex items-center gap-2 group"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive
                      ? "bg-gray-900 text-white ring-4 ring-gray-900/15"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone && !isActive ? <Check size={12} /> : i + 1}
                </span>
                {isActive && (
                  <span className="text-xs font-semibold text-gray-900 hidden lg:inline">
                    {s.label}
                  </span>
                )}
                {i < STEPS.length - 1 && (
                  <span className={`w-6 h-px ${isDone ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/gestor/wizard/chat"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition"
            title="Experimentar o assistente conversacional"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Modo conversacional</span>
            <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded">novo</span>
          </Link>
          <Link
            href="/gestor"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
            title="Sair (Esc)"
          >
            <X size={16} />
            Sair
          </Link>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="md:hidden h-1 bg-gray-200">
        <div
          className="h-full bg-gray-900 transition-all"
          style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto py-10 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step.key === "theme" && <Step1Theme value={data.theme} onSelect={selectTheme} />}
            {step.key === "identity" && (
              <Step2Identity
                data={data.identity}
                onChange={(k, v) => setData((d) => ({ ...d, identity: { ...d.identity, [k]: v } }))}
              />
            )}
            {step.key === "home" && (
              <Step3Home
                data={data.home}
                onChange={(k, v) => setData((d) => ({ ...d, home: { ...d.home, [k]: v } }))}
              />
            )}
            {step.key === "partners" && (
              <Step4Partners items={data.partners} onChange={(v) => setData((d) => ({ ...d, partners: v }))} />
            )}
            {step.key === "google" && (
              <StepGoogle
                data={data.google}
                onChange={(k, v) => setData((d) => ({ ...d, google: { ...d.google, [k]: v } }))}
                onBeforeOAuth={persistBeforeOAuth}
                oauthReturn={oauthReturn ?? undefined}
              />
            )}
            {step.key === "review" && (
              <Step5Review data={data} onApply={apply} applying={applying} applied={applied} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {step.key !== "review" && (
        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
          <button
            onClick={back}
            disabled={stepIdx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-40"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={skip}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <SkipForward size={13} />
              Pular
            </button>
            <button
              onClick={next}
              disabled={!canNext}
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Próximo
              <ArrowRight size={14} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
