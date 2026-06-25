const MAX_CHARS = 8000;

/**
 * processAttachment
 * Receives the raw attachment object sent from the frontend.
 * The frontend sends: { name, mimeType, size, base64 }
 */
const processAttachment = async ({ name, mimeType, base64, size }) => {
  if (!base64) {
    return { type: "other", dataUrl: null, extractedText: `[File: ${name} — no data received]` };
  }

  const isImage = mimeType && mimeType.startsWith("image/");
  const isPDF   = mimeType === "application/pdf";
  const isText  = (mimeType && mimeType.startsWith("text/")) ||
    /\.(js|jsx|ts|tsx|py|json|csv|md|html|css|sh|yaml|yml|xml|txt)$/i.test(name || "");

  if (isImage) {
    return {
      type: "image",
      dataUrl: `data:${mimeType};base64,${base64}`,
      extractedText: null,
    };
  }

  if (isPDF) {
    try {
      const pdfParse = require("pdf-parse");
      const buf = Buffer.from(base64, "base64");
      const parsed = await pdfParse(buf);
      return {
        type: "pdf",
        dataUrl: null,
        extractedText: `[PDF: ${name}]\n${(parsed.text || "").slice(0, MAX_CHARS)}`,
      };
    } catch {
      return { type: "pdf", dataUrl: null, extractedText: `[PDF: ${name}] — Could not extract text.` };
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
    } catch {
      return { type: "text", dataUrl: null, extractedText: `[File: ${name}] — Could not read.` };
    }
  }

  return { type: "other", dataUrl: null, extractedText: `[File: ${name} (${mimeType})]` };
};

module.exports = { processAttachment };