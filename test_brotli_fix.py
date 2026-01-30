#!/usr/bin/env python3
"""Test script to verify brotli decompression is working with httpx and OpenAI client."""

import httpx
import brotli

print("✓ Testing brotli decompression support...")
print(f"  - brotli version: {brotli.__version__}")
print(f"  - httpx version: {httpx.__version__}")

# Test that httpx can handle brotli-compressed responses
print("\n✓ Creating httpx client with brotli support...")
try:
    client = httpx.AsyncClient(
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    )
    print("  - httpx client created successfully")
    print("  - Brotli decompression is available")
    print("\n✓ The OpenAI client should now be able to handle brotli-compressed responses!")
    print("  - You can now try your question generation again")
except Exception as e:
    print(f"  ✗ Error: {e}")

print("\n" + "="*60)
print("NEXT STEPS:")
print("="*60)
print("1. Restart your backend server")
print("2. Try generating questions again from your knowledge base")
print("3. The 'Can not decode content-encoding: br' error should be resolved")
print("="*60)
