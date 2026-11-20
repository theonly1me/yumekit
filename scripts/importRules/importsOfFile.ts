import ts from "typescript";

export interface FoundImport {
  importName: string;
  typesOnly: boolean;
  line: number;
}

function isTypesOnlyDeclaration(
  node: ts.ImportDeclaration | ts.ExportDeclaration,
): boolean {
  if (ts.isExportDeclaration(node)) {
    return (
      node.isTypeOnly ||
      (node.exportClause !== undefined &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.every((element) => element.isTypeOnly))
    );
  }
  const clause = node.importClause;
  if (clause === undefined) {
    return false;
  }
  const bindings = clause.namedBindings;
  return (
    clause.phaseModifier === ts.SyntaxKind.TypeKeyword ||
    (clause.name === undefined &&
      bindings !== undefined &&
      ts.isNamedImports(bindings) &&
      bindings.elements.every((element) => element.isTypeOnly))
  );
}

function importOf(node: ts.Node): Omit<FoundImport, "line"> | undefined {
  if (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteralLike(node.moduleSpecifier)
  ) {
    return {
      importName: node.moduleSpecifier.text,
      typesOnly: isTypesOnlyDeclaration(node),
    };
  }
  if (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword
  ) {
    const [specifier] = node.arguments;
    return specifier !== undefined && ts.isStringLiteralLike(specifier)
      ? { importName: specifier.text, typesOnly: false }
      : undefined;
  }
  if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteralLike(node.argument.literal)
  ) {
    return { importName: node.argument.literal.text, typesOnly: true };
  }
  return undefined;
}

export function importsOfFile(options: {
  fileName: string;
  code: string;
}): FoundImport[] {
  const sourceFile = ts.createSourceFile(
    options.fileName,
    options.code,
    ts.ScriptTarget.Latest,
    true,
  );
  const found: FoundImport[] = [];
  function visit(node: ts.Node): void {
    const imported = importOf(node);
    if (imported !== undefined) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      found.push({ ...imported, line: line + 1 });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}
