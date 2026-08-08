import type { ReactNode } from "react";

export function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="paperSection">
      <h4>{title}</h4>
      <div className="paperGrid">{children}</div>
    </section>
  );
}

export function PaperField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "paperField wide" : "paperField"}>
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}

export function WarrantyNotePreview({ text }: { text: string }) {
  return (
    <div className="note">
      {text.split("\n").map((line, index) =>
        line.trim().endsWith(":") ? (
          <b className="noteHeading" key={index}>
            {line}
          </b>
        ) : (
          <span className="noteLine" key={index}>
            {line}
          </span>
        ),
      )}
    </div>
  );
}
