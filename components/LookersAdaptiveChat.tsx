import React, { useEffect, useRef, useState } from "react";
import type { Lang, ProjectDraft } from "../data/lookersAi";
import {
  nextChatTurn,
  submitChatAnswer,
  getChatRefinements,
  submitChatRefinement,
  skipChatRefinements,
  explainChatQuestion,
  type ChatQuestion,
} from "../services/lookersAiChatWorkflow";
import {
  chatQuestionText,
  chatQuestionHint,
  chatOption,
  aspectRatio,
  chatExample,
  chatPlaceholder,
} from "./lookersChatPresentation";
import { Paperclip, Send } from "lucide-react";
import "./LookersAdaptiveChat.css";

interface Props {
  draft: ProjectDraft;
  lang: Lang;
  busy: boolean;
  generating: boolean;
  notice: string;
  prompt: string;
  onCommit: (draft: ProjectDraft) => void;
  onGenerate: () => void;
  onAttach: () => void;
  onUniverses: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onEditPrompt: (value: string) => void;
  onImprove: () => void;
  onContinue?: (response: string, request: string) => Promise<void>;
}
type HistoryEntry = { question: ChatQuestion; answer: string | string[] };

/** Presentation and transient controls only. The existing backend owns interview progression. */
const LookersAdaptiveChat: React.FC<Props> = (props) => {
  const { draft, lang } = props;
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const turn = nextChatTurn(draft, lang);
  const refinements = getChatRefinements(draft, lang);
  const [refining, setRefining] = useState(false);
  const [confirmation, setConfirmation] = useState<"" | "answer" | "ready">("");
  const [continuing, setContinuing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [revisionRequest, setRevisionRequest] = useState("");
  const [continuationError, setContinuationError] = useState("");
  const [refinementId, setRefinementId] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const optional = refinements.questions.filter((q) => !skipped.includes(q.id));
  const refinement = optional.find((q) => q.id === refinementId) || optional[0];
  const question =
    turn.status === "question"
      ? turn.question
      : refining
        ? refinement
        : undefined;
  const result = draft.step === "result" && !!draft.generatedPrompt;
  const canGenerate =
    turn.status === "ready" && !props.busy && !props.generating;
  const skipAll = () => {
    if (skipChatRefinements(draft, lang).status === "ready") {
      setRefining(false);
      setRefinementId("");
    }
  };
  const save = (answer: string | string[]) => {
    if (!question) return false;
    const response =
      turn.status === "question"
        ? submitChatAnswer(draft, lang, question.id, answer)
        : submitChatRefinement(draft, lang, question.id, answer);
    if (!response.ok) return false;
    setHistory((items) => [...items, { question, answer }]);
    props.onCommit(response.draft);
    setRefinementId("");
    setHistoryIndex(null);
    if (turn.status === "ready") setRefining(false);
    setConfirmation(response.turn.status === "ready" ? "ready" : "answer");
    return true;
  };
  // A new project owns a fresh transient interview; persisted answers stay in ProjectDraft.
  useEffect(() => {
    setHistory([]);
    setHistoryIndex(null);
    setRefining(false);
    setSkipped([]);
    setConfirmation("");
    setContinuing(false);
    setAiResponse("");
    setRevisionRequest("");
  }, [draft.id]);
  const historical = historyIndex === null ? undefined : history[historyIndex];
  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (thread.current)
      thread.current.scrollTop =
        result && !continuing ? 0 : thread.current.scrollHeight;
  }, [question?.id, history.length, result, historyIndex, continuing]);
  const transcript = (
    <>
      {history.length === 0 && draft.answers.idea && (
        <p className="lai-message lai-message--user">
          {String(draft.answers.idea)}
        </p>
      )}
      {history.map((item, index) => (
        <React.Fragment key={`${index}:${item.question.id}`}>
          <p className="lai-message lai-message--assistant">
            {chatQuestionText(item.question, lang)}
          </p>
          <p className="lai-message lai-message--user">
            {(Array.isArray(item.answer) ? item.answer : [item.answer])
              .map((value) =>
                item.question.control.type === "single" ||
                item.question.control.type === "multi"
                  ? item.question.control.options.find(
                      (option) => option.value === value,
                    )?.label
                    ? chatOption(
                        item.question.id,
                        value,
                        item.question.control.options.find(
                          (option) => option.value === value,
                        )!.label,
                        lang,
                      ).label
                    : value
                  : value,
              )
              .join("، ")}
          </p>
        </React.Fragment>
      ))}
    </>
  );
  const utilities = (
    <>
      {confirmation && !result && (
        <p className="lai-saved-confirmation" role="status">
          ✓{" "}
          {confirmation === "ready"
            ? t(
                "Saved. Your answers are complete — generate your prompt when you are ready.",
                "تم حفظ إجابتك. كده الأساسيات خلصت — اضغط «جهّز البرومبت» عشان تشوف البرومبت.",
              )
            : t("Answer saved.", "تم حفظ إجابتك.")}
        </p>
      )}
      {props.notice && (
        <p className="lai-adaptive-notice" role="status">
          {props.notice}
        </p>
      )}
      {!!draft.attachments.length && (
        <ul
          className="lai-adaptive-files"
          aria-label={t("Attached files", "الملفات المرفقة")}
        >
          {draft.attachments.map((file) => (
            <li key={file.id}>
              {file.name} ·{" "}
              {file.processing
                ? t("Preparing…", "بنجهّزه…")
                : file.include
                  ? t("Included", "مرفق")
                  : t("Needs attention", "محتاج مراجعة")}
            </li>
          ))}
        </ul>
      )}
      <div className="lai-adaptive-nav">
        {history.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setHistoryIndex((index) =>
                index === null ? history.length - 1 : Math.max(0, index - 1),
              )
            }
          >
            {t("Previous answer", "الإجابة السابقة")}
          </button>
        )}
        {turn.status === "ready" && !result && (
          <>
            {refining && (
              <button type="button" onClick={skipAll}>
                {t("Skip refinements", "تخطّى التحسينات")}
              </button>
            )}
            <button
              type="button"
              className="lai-chat__generate"
              disabled={!canGenerate}
              onClick={() => {
                setHistoryIndex(null);
                props.onGenerate();
              }}
            >
              {props.generating
                ? t("Generating…", "بنجهّز البرومبت…")
                : t("Generate result", "جهّز البرومبت")}
            </button>
          </>
        )}
      </div>
    </>
  );
  const optionalChoice =
    turn.status === "ready" && question ? (
      <div className="lai-adaptive-refinements">
        <label htmlFor="lai-refinement-choice">
          {t("Optional refinement", "تفصيلة اختيارية")}
        </label>
        <select
          id="lai-refinement-choice"
          value={question.id}
          onChange={(e) => setRefinementId(e.target.value)}
        >
          {optional.map((q) => (
            <option key={q.id} value={q.id}>
              {q.message}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSkipped((ids) => [...ids, question.id]);
            setRefinementId("");
          }}
        >
          {t("Skip this refinement", "تخطّى التفصيلة دي")}
        </button>
      </div>
    ) : null;

  return (
    <section
      className="lai-chat lai-adaptive-chat"
      aria-label={t("Lookers AI chat", "شات Lookers AI")}
      data-testid="adaptive-chat"
    >
      <header className="lai-adaptive-topbar">
        <button type="button" onClick={props.onUniverses}>
          {t("← Universes", "→ المجالات")}
        </button>
        <span role="status">
          {result
            ? t("Your prompt is ready", "البرومبت جاهز")
            : turn.status === "ready"
              ? t("Ready to generate", "جاهز للتوليد")
              : t(
                  `${turn.remaining} essential questions left`,
                  `باقي ${turn.remaining} أسئلة أساسية`,
                )}
        </span>
      </header>
      {!historical && !result && question ? (
        <ChatQuestionControl
          key={`${draft.id}:${question.id}`}
          question={question}
          lang={lang}
          disabled={props.busy || props.generating}
          explanation={() =>
            explainChatQuestion(
              draft,
              lang,
              turn.status === "ready" ? question.id : undefined,
            )
          }
          onSubmit={save}
          threadRef={thread}
          before={
            <>
              {transcript}
              {optionalChoice}
            </>
          }
          footer={utilities}
          onAttach={props.onAttach}
        />
      ) : (
        <>
          <div
            className="lai-adaptive-body"
            ref={thread}
            data-testid="conversation-thread"
            role="log"
            aria-label={t("Conversation", "المحادثة")}
          >
            {historical ? (
              <article
                className="lai-adaptive-history"
                aria-label={t("Confirmed answer", "إجابة محفوظة")}
              >
                <h2>{t("Previous confirmed answer", "إجابتك المحفوظة")}</h2>
                <p className="lai-message lai-message--assistant">
                  {historical.question.message}
                </p>
                <p className="lai-message lai-message--user">
                  {Array.isArray(historical.answer)
                    ? historical.answer.join("، ")
                    : historical.answer}
                </p>
                <button type="button" onClick={() => setHistoryIndex(null)}>
                  {t("Return to current step", "ارجع للخطوة الحالية")}
                </button>
              </article>
            ) : result ? (
              <div className="lai-adaptive-result">
                <label htmlFor="lai-chat-result">
                  {t("Your prompt", "البرومبت بتاعك")}
                </label>
                <textarea
                  id="lai-chat-result"
                  className="lookers-ai__prompt-output"
                  value={props.prompt}
                  onChange={(e) => props.onEditPrompt(e.target.value)}
                />
                <div className="lai-chat__actions">
                  <button type="button" onClick={props.onCopy}>
                    {t("Copy", "نسخ")}
                  </button>
                  <button type="button" onClick={props.onDownload}>
                    {t("Download", "تنزيل")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      props.onImprove();
                      setRefining(false);
                    }}
                  >
                    {t("Return to conversation", "ارجع للمحادثة")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContinuing(true);
                      setContinuationError("");
                    }}
                  >
                    {t("Improve", "تحسين")}
                  </button>
                </div>
                {props.onContinue && (
                  <section className="lai-continuation-editor">
                    <h2>
                      {t(
                        "Continue after the AI response",
                        "نكمل على رد الـ AI",
                      )}
                    </h2>
                    <p>
                      {t(
                        "Paste the reply you received and tell us what to change or add. Your original brief and answers stay with the project.",
                        "خدت الرد من أداة الـ AI؟ حطّه هنا وقولّي عايز تغيّر أو تزود إيه. فكرتك وإجاباتك الأصلية هتفضل محفوظة.",
                      )}
                    </p>
                    {!continuing ? (
                      <button
                        type="button"
                        className="lai-secondary-button"
                        onClick={() => setContinuing(true)}
                      >
                        {t(
                          "Add a reply or request a change",
                          "ضيف رد الـ AI أو اطلب تعديل",
                        )}
                      </button>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (
                            !revisionRequest.trim() ||
                            props.generating ||
                            props.busy
                          )
                            return;
                          setContinuationError("");
                          try {
                            await props.onContinue!(
                              aiResponse,
                              revisionRequest,
                            );
                            setContinuing(false);
                            setAiResponse("");
                            setRevisionRequest("");
                          } catch {
                            setContinuationError(
                              t(
                                "Shorten the pasted reply or requested changes and try again.",
                                "اختصر رد الـ AI أو التعديل المكتوب شوية وجرّب تاني.",
                              ),
                            );
                          }
                        }}
                      >
                        <label htmlFor="lai-ai-response">
                          {t(
                            "AI response (optional)",
                            "رد الـ AI اللي وصلك — اختياري",
                          )}
                        </label>
                        <textarea
                          id="lai-ai-response"
                          value={aiResponse}
                          maxLength={3000}
                          disabled={props.generating || props.busy}
                          onChange={(e) => setAiResponse(e.target.value)}
                          placeholder={t(
                            "Paste the reply from the AI tool…",
                            "انسخ رد الأداة وحطّه هنا…",
                          )}
                        />
                        <label htmlFor="lai-revision-request">
                          {t(
                            "What should change or be added?",
                            "عايز نعدّل أو نزود إيه؟",
                          )}
                        </label>
                        <textarea
                          id="lai-revision-request"
                          value={revisionRequest}
                          maxLength={1000}
                          required
                          disabled={props.generating || props.busy}
                          onChange={(e) => setRevisionRequest(e.target.value)}
                          placeholder={t(
                            "For example: keep the bottle, use a darker background and leave room for a headline.",
                            "مثلًا: خلي الزجاجة زي ما هي، وغمّق الخلفية وسيب مكان لعنوان.",
                          )}
                        />
                        {continuationError && (
                          <p role="alert">{continuationError}</p>
                        )}
                        <div className="lai-chat__actions">
                          <button
                            type="submit"
                            disabled={
                              !revisionRequest.trim() ||
                              props.generating ||
                              props.busy
                            }
                          >
                            {props.generating
                              ? t("Updating…", "بنعدّل البرومبت…")
                              : t("Update prompt", "جهّز البرومبت بالتعديل")}
                          </button>
                          <button
                            type="button"
                            disabled={props.generating}
                            onClick={() => setContinuing(false)}
                          >
                            {t("Cancel", "إلغاء")}
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                )}
              </div>
            ) : (
              <>
                {transcript}
                <div className="lai-message lai-message--assistant lai-adaptive-ready">
                  <h2>{t("Ready when you are.", "كده الأساسيات خلصت ✓")}</h2>
                  <p>
                    {t(
                      "Your essential answers are saved. Generate now, or add optional details.",
                      "إجاباتك اتحفظت. اضغط «جهّز البرومبت» عشان تشوفه، أو ضيف تفصيلة تانية لو حابب.",
                    )}
                  </p>
                  {refinements.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSkipped([]);
                        setConfirmation("");
                        setRefining(true);
                      }}
                    >
                      {t("Add optional refinements", "ضيف تفاصيل اختيارية")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <footer className="lai-adaptive-footer">
            {utilities}
            <button
              type="button"
              className="lai-attach"
              onClick={props.onAttach}
              disabled={props.busy || props.generating}
            >
              {t("Attach file", "ضيف ملف")}
            </button>
          </footer>
        </>
      )}
    </section>
  );
};

export default LookersAdaptiveChat;

export function ChatQuestionControl({
  question,
  lang,
  disabled,
  explanation,
  onSubmit,
  before,
  footer,
  onAttach,
  threadRef,
}: {
  key?: string;
  question: ChatQuestion;
  lang: Lang;
  disabled: boolean;
  explanation: () => string | null;
  onSubmit: (answer: string | string[]) => boolean;
  before?: React.ReactNode;
  footer?: React.ReactNode;
  onAttach?: () => void;
  threadRef?: React.RefObject<HTMLDivElement>;
}) {
  const [value, setValue] = useState<string | string[]>("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState(false);
  const submitted = useRef(false);
  const [sent, setSent] = useState(false);
  const { control } = question;
  const choice = control.type === "single" || control.type === "multi";
  const filled = Array.isArray(value)
    ? value.length > 0
    : value.trim().length > 0;
  const helpId = `lai-chat-help-${question.id}`;
  return (
    <form
      className="lai-adaptive-question"
      data-testid="active-question"
      data-question-id={question.id}
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || submitted.current) return;
        if (!onSubmit(value)) setError(true);
        else {
          submitted.current = true;
          setSent(true);
        }
      }}
    >
      <div
        className="lai-adaptive-body"
        ref={threadRef}
        data-testid="conversation-thread"
        role="log"
        aria-label={lang === "ar" ? "المحادثة" : "Conversation"}
      >
        {before}
        <div className="lai-current-message" data-testid="question-content">
          <div className="lai-message lai-message--assistant">
            <h2 id={`lai-chat-label-${question.id}`}>
              {chatQuestionText(question, lang)}
            </h2>
            {chatQuestionHint(question, lang) && (
              <p className="lai-adaptive-example">
                {chatQuestionHint(question, lang)}
              </p>
            )}
            {!choice && control.example && (
              <p className="lai-adaptive-example">
                {lang === "ar" ? "مثال: " : "Example: "}
                {chatExample(question, lang)}
              </p>
            )}
          </div>
          {choice && (
            <fieldset
              className="lai-adaptive-options"
              aria-labelledby={`lai-chat-label-${question.id}`}
              disabled={disabled}
            >
              {control.options.map((option) => (
                <label
                  key={option.value}
                  className={
                    (
                      Array.isArray(value)
                        ? value.includes(option.value)
                        : value === option.value
                    )
                      ? "is-selected"
                      : ""
                  }
                >
                  <input
                    type={control.type === "single" ? "radio" : "checkbox"}
                    name={question.id}
                    aria-label={
                      chatOption(question.id, option.value, option.label, lang)
                        .label
                    }
                    aria-describedby={
                      chatOption(question.id, option.value, option.label, lang)
                        .detail
                        ? `lai-option-${question.id}-${option.value}-detail`
                        : undefined
                    }
                    value={option.value}
                    checked={
                      Array.isArray(value)
                        ? value.includes(option.value)
                        : value === option.value
                    }
                    onChange={() => {
                      setError(false);
                      setValue((current) =>
                        control.type === "single"
                          ? option.value
                          : Array.isArray(current) &&
                              current.includes(option.value)
                            ? current.filter((v) => v !== option.value)
                            : [
                                ...(Array.isArray(current) ? current : []),
                                option.value,
                              ],
                      );
                    }}
                  />
                  {question.id === "format" && aspectRatio(option.value) && (
                    <span className="lai-ratio-preview" aria-hidden="true">
                      <span
                        style={{
                          width: `${Math.min(1, aspectRatio(option.value)!.width / aspectRatio(option.value)!.height) * 38}px`,
                          height: `${Math.min(1, aspectRatio(option.value)!.height / aspectRatio(option.value)!.width) * 38}px`,
                        }}
                      />
                    </span>
                  )}
                  <span className="lai-option-copy">
                    <strong>
                      {
                        chatOption(
                          question.id,
                          option.value,
                          option.label,
                          lang,
                        ).label
                      }
                    </strong>
                    {chatOption(question.id, option.value, option.label, lang)
                      .detail && (
                      <small
                        id={`lai-option-${question.id}-${option.value}-detail`}
                      >
                        {
                          chatOption(
                            question.id,
                            option.value,
                            option.label,
                            lang,
                          ).detail
                        }
                      </small>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <button
            type="button"
            className="lai-explain"
            aria-expanded={helpOpen}
            aria-controls={helpId}
            onClick={() => setHelpOpen((open) => !open)}
          >
            {question.helpLabel}
          </button>
          {helpOpen && (
            <p id={helpId} className="lai-adaptive-help" role="note">
              {explanation()}
            </p>
          )}
          {error && (
            <p role="alert">
              {lang === "ar"
                ? "الإجابة مش صالحة. راجعها وجرب تاني."
                : "Please check your answer and try again."}
            </p>
          )}
        </div>
      </div>
      <footer className="lai-adaptive-footer">
        {footer}
        <div className="lai-composer">
          {onAttach && (
            <button
              type="button"
              className="lai-attach"
              onClick={onAttach}
              disabled={disabled}
              aria-label={lang === "ar" ? "ضيف ملف" : "Attach file"}
            >
              <Paperclip size={20} aria-hidden="true" />
            </button>
          )}
          {choice ? (
            <p className="lai-composer-hint">
              {lang === "ar"
                ? control.type === "multi"
                  ? "اختار إجاباتك، وبعدين اضغط إرسال"
                  : "اختار إجابة، وبعدين اضغط إرسال"
                : control.type === "multi"
                  ? "Select your choices, then send"
                  : "Select a choice, then send"}
            </p>
          ) : (
            <input
              type="text"
              aria-labelledby={`lai-chat-label-${question.id}`}
              value={typeof value === "string" ? value : ""}
              placeholder={chatPlaceholder(question, lang)}
              maxLength={4000}
              disabled={disabled}
              onChange={(e) => {
                setError(false);
                setValue(e.target.value);
              }}
            />
          )}
          <button
            type="submit"
            className="lai-send"
            disabled={disabled || !filled || sent}
            aria-label={question.submitLabel}
          >
            <Send size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="lai-composer-caption">
          {lang === "ar"
            ? "تقدر تولّد أول ما الأساسيات تكتمل ✦"
            : "Generate as soon as the essentials are complete ✦"}
        </p>
      </footer>
    </form>
  );
}
