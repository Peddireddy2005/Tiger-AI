const MAX_CHARS = 8000;

const processAttachment = async ({ name, mimeType, base64, size }) => {
  if (!base64) {
    return { type: "other", dataUrl: null, extractedText: `[File: ${name}] — No data received.` };
  }

  const isImage = mimeType?.startsWith("image/");
  const isPDF   = mimeType === "application/pdf";
  const isText  =
    mimeType?.startsWith("text/") ||
    /\.(js|jsx|ts|tsx|py|json|csv|md|html|css|sh|yaml|yml|xml|txt)$/i.test(name);

  if (isImage) {
    return {
      type: "image",
      dataUrl: `data:${mimeType};base64,${base64}`,
      extractedText: null,
    };
  }

  if (isPDF) {
    try {
      // pdf-parse v1.1.1 — default export is a plain function: pdfParse(buffer)
      const pdfParse = require("pdf-parse");
      const buf = Buffer.from(base64, "base64");
      const result = await pdfParse(buf);

      const rawText = result?.text || "";
      const text = rawText.trim().slice(0, MAX_CHARS);

      if (!text) {
        return {
          type: "pdf",
          dataUrl: null,
          extractedText: `[PDF: ${name}]\n\n⚠️ No readable text was extracted. This PDF may be image-based (scanned), password-protected, or use non-standard encoding.\n\nPlease paste the text content directly into the chat, or upload a .docx/.txt version instead.`,
        };
      }

      return {
        type: "pdf",
        dataUrl: null,
        extractedText: `[PDF: ${name} — ${result.numpages || "?"} page(s)]\n\n${text}`,
      };
    } catch (e) {
      console.error("PDF parse error:", e.message);
      return {
        type: "pdf",
        dataUrl: null,
        extractedText: `[PDF: ${name}]\n\n⚠️ Could not extract text from this PDF (${e.message}).\n\nThe file may be corrupted, encrypted, or scanned (image-only). Please paste the text directly into the chat instead.`,
      };
    }
  }

  if (isText) {
    try {
      const text = Buffer.from(base64, "base64").toString("utf8").slice(0, MAX_CHARS);
      return {
        type: "text",
        dataUrl: null,
        extractedText: `[File: ${name}]\n\`\`\`\n${text}\n\`\`\``,
      };
    } catch (e) {
      return {
        type: "text",
        dataUrl: null,
        extractedText: `[File: ${name}] — Could not read file: ${e.message}`,
      };
    }
  }

  return {
    type: "other",
    dataUrl: null,
    extractedText: `[File: ${name} (${mimeType || "unknown type"})]`,
  };
};

module.exports = { processAttachment };
