#!/bin/bash
# Setup script to install git hooks

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

echo "Installing git hooks..."

# Make sure .githooks/pre-commit is executable
chmod +x "$GITHOOKS_DIR/pre-commit"

# Create a wrapper pre-commit hook that calls both Python linting and Husky
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
# Combined pre-commit hook for Python linting and Husky

# Get repository root
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Run Python linting check
if [ -f "$REPO_ROOT/.githooks/pre-commit" ]; then
    "$REPO_ROOT/.githooks/pre-commit"
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# Run Husky hooks (if they exist from client setup)
if [ -f "$REPO_ROOT/.git/hooks/husky.sh" ]; then
    . "$REPO_ROOT/.git/hooks/husky.sh"
fi

exit 0
EOF

# Make the installed hook executable
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo "   Python files will be checked with black before commit."
