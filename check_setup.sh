#!/bin/bash
# DeepTutor Setup Checker

echo "🔍 DeepTutor Setup Checker"
echo "=========================="
echo ""

# Check Python version
echo "[1] Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python found: $PYTHON_VERSION"
else
    echo "✗ Python 3 not found!"
    exit 1
fi

# Check virtual environment
echo ""
echo "[2] Checking virtual environment..."
if [ -d ".venv" ]; then
    echo "✓ Virtual environment exists at .venv"

    # Check if activated
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        echo "✓ Virtual environment is activated"
    else
        echo "⚠ Virtual environment exists but not activated"
        echo "  Run: source .venv/bin/activate"
    fi
else
    echo "✗ Virtual environment not found!"
    echo "  Run: python3 -m venv .venv"
    exit 1
fi

# Check dependencies
echo ""
echo "[3] Checking Python dependencies..."
source .venv/bin/activate

REQUIRED_PACKAGES=("PyYAML" "fastapi" "uvicorn" "openai" "llama-index" "raganything")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if pip show "$package" &> /dev/null; then
        echo "✓ $package installed"
    else
        echo "✗ $package not installed"
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    echo ""
    echo "⚠ Missing packages detected!"
    echo "  Run: pip install -r requirements.txt"
fi

# Check if backend server is running
echo ""
echo "[4] Checking backend server..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ Backend server is running on port 8000"
else
    echo "✗ Backend server is NOT running"
    echo "  Run: python src/api/main.py"
fi

# Check if frontend server is running
echo ""
echo "[5] Checking frontend server..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ Frontend server is running on port 3000"
else
    echo "⚠ Frontend server is NOT running"
    echo "  Run: cd web && npm run dev"
fi

# Check knowledge bases
echo ""
echo "[6] Checking knowledge bases..."
if [ -f "data/knowledge_bases/kb_config.json" ]; then
    KB_COUNT=$(cat data/knowledge_bases/kb_config.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('knowledge_bases', {})))" 2>/dev/null || echo "0")
    echo "✓ Found $KB_COUNT knowledge base(s)"

    # List them
    if [ "$KB_COUNT" != "0" ]; then
        cat data/knowledge_bases/kb_config.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
for name, info in data.get('knowledge_bases', {}).items():
    status = info.get('status', 'unknown')
    provider = info.get('rag_provider', 'unknown')
    print(f'  - {name}: {status} (provider: {provider})')
" 2>/dev/null
    fi
else
    echo "⚠ No knowledge bases found"
fi

echo ""
echo "=========================="
echo "Setup check complete!"
echo ""
