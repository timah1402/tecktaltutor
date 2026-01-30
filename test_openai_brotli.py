#!/usr/bin/env python3
"""Test OpenAI client with brotli decompression."""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Load environment
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

import httpx
import brotli
import openai

print("=" * 60)
print("Testing OpenAI Client with Brotli Decompression")
print("=" * 60)
print(f"✓ brotli version: {brotli.__version__}")
print(f"✓ httpx version: {httpx.__version__}")
print(f"✓ openai version: {openai.__version__}")
print()

# Test httpx brotli support
print("Testing httpx brotli support...")
try:
    http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    )
    print("✓ httpx AsyncClient created successfully")
    print()
except Exception as e:
    print(f"✗ Error creating httpx client: {e}")
    sys.exit(1)

# Test OpenAI client
print("Testing OpenAI client...")
try:
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_HOST")

    if not api_key:
        print("✗ Error: LLM_API_KEY not set in .env file")
        sys.exit(1)

    print(f"  API endpoint: {base_url}")

    # Create OpenAI client with brotli-enabled httpx client
    client = openai.AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        http_client=http_client,
    )
    print("✓ OpenAI client created successfully")
    print()

    # Test actual API call
    print("Testing API call with brotli decompression...")

    async def test_call():
        try:
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Say 'hello' in one word"}],
                max_tokens=10,
            )
            return response
        except Exception as e:
            print(f"✗ API call failed: {e}")
            import traceback
            traceback.print_exc()
            return None

    response = asyncio.run(test_call())

    if response:
        print("✓ API call successful!")
        print(f"  Response: {response.choices[0].message.content}")
        print()
        print("=" * 60)
        print("SUCCESS: Brotli decompression is working!")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("FAILED: API call returned error")
        print("=" * 60)
        sys.exit(1)

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
