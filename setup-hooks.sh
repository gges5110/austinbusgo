#!/bin/bash
# Setup script to install git hooks

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

echo "Installing git hooks..."

# Make .githooks/pre-commit executable
chmod +x "$GITHOOKS_DIR/pre-commit"

# Install pre-commit hook pointing to .githooks/pre-commit
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
REPO_ROOT="$(git rev-parse --show-toplevel)"
"$REPO_ROOT/.githooks/pre-commit"
EOF

chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo "   Python files will be checked with black before commit."
echo "   Frontend files will be checked with lint-staged before commit."
