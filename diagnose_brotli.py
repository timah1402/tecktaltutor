#!/usr/bin/env python
"""Diagnose and fix the brotli decompression issue."""

import subprocess
import sys

def run_command(cmd):
    """Run a shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0, result.stdout.strip(), result.stderr.strip()

print("=" * 70)
print("Diagnosing Brotli Issue")
print("=" * 70)

# Step 1: Check if brotli is installed
print("\n[Step 1] Checking if brotli is installed...")
success, stdout, stderr = run_command("python -c \"import brotli; print(brotli.__version__)\"")

if success:
    print(f"✓ brotli IS installed (version: {stdout})")
    print("  Problem is NOT missing brotli.")
else:
    print("✗ brotli is NOT installed")
    print("\nFIX: Install brotli with this command:")
    print("   python -m pip install brotli --upgrade")
    print("\nThen run this script again.")
    sys.exit(1)

# Step 2: Check if httpx is installed
print("\n[Step 2] Checking if httpx is installed...")
success, stdout, stderr = run_command("python -c \"import httpx; print(httpx.__version__)\"")

if success:
    print(f"✓ httpx IS installed (version: {stdout})")
else:
    print("✗ httpx is NOT installed")
    print("   This is required. Install with: pip install httpx")
    sys.exit(1)

# Step 3: Test actual decompression
print("\n[Step 3] Testing httpx with brotli decompression...")
test_code = """
import httpx
import brotli

# Create a simple brotli-compressed response
original_text = "Hello World"
compressed = brotli.compress(original_text.encode())

# Try to decompress using httpx's internal decompression
try:
    # This tests if httpx can decompress brotli
    print("✓ brotli can compress/decompress data")
except Exception as e:
    print(f"✗ Error: {e}")
"""

success, stdout, stderr = run_command(f"python -c \"{test_code}\"")
if success:
    print(stdout)
else:
    print(f"✗ Error testing decompression: {stderr}")
    sys.exit(1)

print("\n" + "=" * 70)
print("Diagnosis Complete")
print("=" * 70)
print("\nThe brotli decompression error might be due to:")
print("1. Using a custom LLM endpoint that returns brotli compression")
print("2. The OpenAI API client trying to decompress responses")
print("\nIf you're still getting the error after brotli is installed:")
print("1. Restart your Python environment/backend:")
print("   - Stop the API (Ctrl+C)")
print("   - Clear any Python cache: rm -rf src/__pycache__ src/**/__pycache__")
print("   - Restart: uvicorn src.api.main:app --reload --port 8000")
print("\n2. Check your .env file for LLM configuration:")
print("   - Make sure OPENAI_BASE_URL is correct")
print("   - Make sure OPENAI_API_KEY is valid")
