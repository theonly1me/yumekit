import ts from "typescript";

function isVideoTag(node: ts.Node): boolean {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    return ts.isIdentifier(node.tagName) && node.tagName.text === "video";
  }
  if (ts.isCallExpression(node)) {
    const [firstArgument] = node.arguments;
    const calledName = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText();
    return (
      calledName === "createElement" &&
      firstArgument !== undefined &&
      ts.isStringLiteralLike(firstArgument) &&
      firstArgument.text.toLowerCase() === "video"
    );
  }
  return false;
}

export function firstVideoElementOf(
  sourceFile: ts.SourceFile,
): ts.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    return isVideoTag(node) ? node : ts.forEachChild(node, find);
  }
  return find(sourceFile);
}
