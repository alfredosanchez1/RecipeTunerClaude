#!/bin/bash

echo "📦 Instalando git hooks..."

# Copiar pre-commit hook
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks instalados correctamente"
echo ""
echo "El pre-commit hook verificará automáticamente:"
echo "  - node_modules no esté en commits"
echo "  - Archivos de build no estén en commits"
echo "  - Archivos .env (advertencia)"
echo "  - Archivos grandes (advertencia)"
echo "  - .DS_Store no esté en commits"
echo ""
echo "Para más información: cat .git/hooks/README.md"
