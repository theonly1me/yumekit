import ts from "typescript";

function specifierText(specifier: ts.Node | undefined): string {
  if (specifier === undefined) {
    return "";
  }
  return ts.isStringLiteralLike(specifier)
    ? specifier.text
    : specifier.getText();
}

function importNameOf(node: ts.Node): string | undefined {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    return node.moduleSpecifier === undefined
      ? undefined
      : specifierText(node.moduleSpecifier);
  }
  if (ts.isExternalModuleReference(node)) {
    return specifierText(node.expression);
  }
  if (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword
  ) {
    return specifierText(node.arguments[0]);
  }
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
    return specifierText(node.argument.literal);
  }
  return undefined;
}

export function sceneImportsOf(sourceFile: ts.SourceFile): string[] {
  const importNames: string[] = [];
  function visit(node: ts.Node): void {
    const importName = importNameOf(node);
    if (importName !== undefined) {
      importNames.push(importName);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return importNames;
}
