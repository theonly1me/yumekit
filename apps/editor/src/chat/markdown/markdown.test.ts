import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownText } from "./MarkdownText.js";

function htmlOf(text: string): string {
  return renderToStaticMarkup(createElement(MarkdownText, { text }));
}

describe("the Markdown of an answer", () => {
  it("draws bold, italic, and a numbered list with no marks left", () => {
    expect(
      htmlOf(
        "The scenes:\n1. **Hook:** a *calm* line\n2. **Problem:** a crash",
      ),
    ).toBe(
      '<div><p><span>The scenes:</span></p><ol start="1"><li><strong>Hook:</strong> a <em>calm</em> line</li><li><strong>Problem:</strong> a crash</li></ol></div>',
    );
  });

  it("keeps a line break inside a paragraph, and starts a new paragraph after a blank line", () => {
    expect(htmlOf("One line\nnext line\n\nNew part")).toBe(
      "<div><p><span>One line</span><span><br/>next line</span></p><p><span>New part</span></p></div>",
    );
  });

  it("draws a list with dashes as a list", () => {
    expect(htmlOf("- The voice\n- The music")).toBe(
      "<div><ul><li>The voice</li><li>The music</li></ul></div>",
    );
  });

  it("shows a script tag of a message as text, never as an element", () => {
    const html = htmlOf("Hello <script>alert(1)</script> **there**");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("keeps an underscore inside a word, as in a file name", () => {
    expect(htmlOf("Open my_file_name.png")).toBe(
      "<div><p><span>Open my_file_name.png</span></p></div>",
    );
  });
});
