import { useMemo, useRef } from "react";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.css";

export default function RichTextEditor({ value, onChange, placeholder, height = 360 }) {
  const editorRef = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || "",
      height,
      toolbarAdaptive: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_as_html",
      className: "jodit-editor-wrap",
      style: {
        color: "#374151",
        fontSize: "14px",
        lineHeight: "1.6",
      },
    }),
    [placeholder, height],
  );

  return (
    <div className="jodit-editor-wrap text-gray-700">
      <JoditEditor
        ref={editorRef}
        value={value || ""}
        config={config}
        onBlur={(html) => onChange?.(html)}
      />
    </div>
  );
}
