#!/bin/bash
# Setup script to install git hooks

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

echo "Installing git hooks..."

# Remove stale husky v4 hook files
for hook in pre-commit prepare-commit-msg commit-msg pre-push post-checkout post-merge post-rewrite; do
    HOOK_FILE="$HOOKS_DIR/$hook"
    if [ -f "$HOOK_FILE" ] && grep -q "husky" "$HOOK_FILE" 2>/dev/null; then
        rm "$HOOK_FILE"
        echo "  Removed stale husky hook: $hook"
    fi
done

for file in husky.sh husky.local.sh; do
    if [ -f "$HOOKS_DIR/$file" ]; then
        rm "$HOOKS_DIR/$file"
        echo "  Removed stale husky file: $file"
    fi
done

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
