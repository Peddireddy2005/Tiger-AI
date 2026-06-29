const MAX_CHARS = 8000;

const processAttachment = async ({ name, mimeType, base64, size }) => {
  if (!base64) {
    return { type: "other", dataUrl: null, extractedText: `[File: ${name}] — No data received.` };
  }

  const isImage = mimeType?.startsWith("image/");
  const isPDF = mimeType === "application/pdf";
  const isText =
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
      const pdfParse = require("pdf-parse");
      const buf = Buffer.from(base64, "base64");
      const parsed = await pdfParse(buf);
      const text = parsed.text?.slice(0, MAX_CHARS) || "";
      return {
        type: "pdf",
        dataUrl: null,
        extractedText: `[PDF: ${name}]\n${text}`,
      };
    } catch (e) {
      console.error("PDF parse error:", e.message);
      return {
        type: "pdf",
        dataUrl: null,
        extractedText: `[PDF: ${name}] — Could not extract text.`,
      };
    }
  }

  if (isText) {
    try {
      const text = Buffer.from(base64, "base64")
        .toString("utf8")
        .slice(0, MAX_CHARS);
      return {
        type: "text",
        dataUrl: null,
        extractedText: `[File: ${name}]\n\`\`\`\n${text}\n\`\`\``,
      };
    } catch (e) {
      return {
        type: "text",
        dataUrl: null,
        extractedText: `[File: ${name}] — Could not read file.`,
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
