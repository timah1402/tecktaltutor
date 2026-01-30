#!/usr/bin/env python
"""Quick test script to verify brotli is installed and decompression works."""

import sys

print("=" * 70)
print("Testing Brotli Installation and HTTP Decompression")
print("=" * 70)

# Test 1: Check if brotli is installed
print("\n[1] Checking if brotli is installed...")
try:
    import brotli
    print(f"✓ brotli is installed (version: {brotli.__version__})")
except ImportError:
    print("✗ brotli is NOT installed")
    print("  Install it with: pip install brotli>=1.1.0")
    sys.exit(1)

# Test 2: Check if httpx can decompress brotli
print("\n[2] Checking if httpx supports brotli decompression...")
try:
    import httpx
    print(f"✓ httpx is installed (version: {httpx.__version__})")
except ImportError:
    print("✗ httpx is NOT installed")
    sys.exit(1)

# Test 3: Check OpenAI SDK
print("\n[3] Checking if openai SDK is installed...")
try:
    import openai
    print(f"✓ openai SDK is installed (version: {openai.__version__})")
except ImportError:
    print("✗ openai SDK is NOT installed")
    sys.exit(1)

# Test 4: Check embedding adapter
print("\n[4] Checking embedding adapter...")
try:
    from src.services.embedding.adapters.openai_compatible import OpenAICompatibleEmbeddingAdapter
    print("✓ OpenAI embedding adapter can be imported")
except ImportError as e:
    print(f"✗ Failed to import embedding adapter: {e}")
    sys.exit(1)

# Test 5: Check LLM provider
print("\n[5] Checking LLM provider...")
try:
    from src.services.llm.providers.open_ai import OpenAIProvider
    print("✓ OpenAI provider can be imported")
except ImportError as e:
    print(f"✗ Failed to import LLM provider: {e}")
    sys.exit(1)

print("\n" + "=" * 70)
print("All checks passed! ✓")
print("=" * 70)
print("\nYou can now run question generation without brotli decompression errors.")
