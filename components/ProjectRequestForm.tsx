import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Mail, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { services } from "../data/services";
import { contact, whatsappUrl } from "../data/site";

const ProjectRequestForm: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [params] = useSearchParams();
  const demo = params.get("product") === "hera";
  const service = params.get("service");
  const initial = demo
    ? "hera"
    : services.some((s) => s.id === service)
      ? service!
      : "other";
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    service: initial,
    budget: "undecided",
    details: "",
  });
  const [prepared, setPrepared] = useState("");
  const [error, setError] = useState(false);
  const update = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setPrepared("");
    setError(false);
  };
  const options = [
    ...services.map((s) => ({ id: s.id, label: s.title[lang] })),
    {
      id: "hera",
      label: ar ? "طلب ديمو HERA SYSTEM ERP" : "HERA SYSTEM ERP demo",
    },
    { id: "other", label: ar ? "طلب آخر" : "Something else" },
  ];
  const budgets = [
    { id: "undecided", label: ar ? "لسه مش محدد" : "Not decided yet" },
    {
      id: "discuss",
      label: ar ? "نحددها بعد مناقشة النطاق" : "Let’s discuss the scope first",
    },
    {
      id: "defined",
      label: ar ? "عندي ميزانية محددة هنناقشها" : "I have a budget to discuss",
    },
  ];
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim() || !values.details.trim()) {
      setError(true);
      return;
    }
    setError(false);
    const label =
      options.find((o) => o.id === values.service)?.label ?? values.service;
    const text = [
      ar
        ? "طلب جديد من موقع LookersHub"
        : "New inquiry from the LookersHub website",
      `${ar ? "الاسم" : "Name"}: ${values.name.trim()}`,
      `${ar ? "الإيميل" : "Email"}: ${values.email.trim()}`,
      values.phone.trim()
        ? `${ar ? "الهاتف" : "Phone"}: ${values.phone.trim()}`
        : "",
      `${ar ? "الخدمة" : "Service"}: ${label}`,
      !compact
        ? `${ar ? "الميزانية" : "Budget"}: ${budgets.find((b) => b.id === values.budget)?.label}`
        : "",
      `${ar ? "التفاصيل" : "Details"}: ${values.details.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    setPrepared(text);
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  };
  return (
    <form className="request-form glass-panel" onSubmit={submit}>
      {error && (
        <p role="alert">
          {ar
            ? "اكتب اسمك وتفاصيل طلبك قبل المتابعة."
            : "Please enter your name and inquiry details before continuing."}
        </p>
      )}
      <div className="form-grid">
        <label htmlFor="request-name">
          {ar ? "الاسم" : "Full name"}
          <input
            id="request-name"
            autoComplete="name"
            required
            maxLength={100}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label htmlFor="request-email">
          {ar ? "البريد الإلكتروني" : "Email"}
          <input
            id="request-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            maxLength={160}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="request-phone">
          {ar ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
          <input
            id="request-phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={30}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </label>
        <label htmlFor="request-service">
          {ar ? "محتاج إيه؟" : "What do you need?"}
          <select
            id="request-service"
            value={values.service}
            onChange={(e) => update("service", e.target.value)}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!compact && (
        <label htmlFor="request-budget">
          {ar ? "الميزانية" : "Budget"}
          <select
            id="request-budget"
            value={values.budget}
            onChange={(e) => update("budget", e.target.value)}
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label htmlFor="request-details">
        {ar
          ? values.service === "hera"
            ? "احكيلنا عن شركتك واحتياجاتك من الديمو"
            : "احكيلنا عن فكرتك"
          : values.service === "hera"
            ? "Tell us about your company and demo needs"
            : "Tell us about your idea"}
        <textarea
          id="request-details"
          required
          rows={5}
          maxLength={2000}
          value={values.details}
          onChange={(e) => update("details", e.target.value)}
        />
      </label>
      <p className="form-note">
        {ar
          ? "هنجهّز رسالتك ونفتح واتساب. راجعها واضغط إرسال هناك لإتمام الطلب."
          : "We’ll prepare your message and open WhatsApp. Review it and press Send there to complete your inquiry."}
      </p>
      <button className="site-button" type="submit">
        <MessageCircle size={19} />
        {ar ? "كمّل الطلب على واتساب" : "Continue on WhatsApp"}
        <ArrowUpRight size={18} />
      </button>
      {prepared && (
        <div className="form-prepared" role="status">
          <p>
            {ar
              ? "رسالتك جاهزة. الإرسال يتم من واتساب؛ لو ما فتحش، استخدم الرابط التالي."
              : "Your message is ready. Send it in WhatsApp; if it did not open, use the link below."}
          </p>
          <a
            className="text-link"
            href={whatsappUrl(prepared)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ar ? "افتح الرسالة على واتساب" : "Open message in WhatsApp"}
          </a>
          <a
            className="text-link"
            href={`mailto:${contact.email}?subject=${encodeURIComponent(values.service === "hera" ? "HERA demo request" : "LookersHub project inquiry")}&body=${encodeURIComponent(prepared)}`}
          >
            <Mail size={16} />
            {ar ? "أو افتحها في تطبيق البريد" : "Or open in your email app"}
          </a>
        </div>
      )}
    </form>
  );
};

export default ProjectRequestForm;
