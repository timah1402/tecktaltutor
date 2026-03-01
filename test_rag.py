#!/usr/bin/env python
"""Quick test of RAG search"""
import asyncio
import sys
sys.path.insert(0, '/Users/mac/Desktop/DeepTutor')

from src.tools.rag_tool import rag_search

async def test():
    result = await rag_search(
        query="What is the capital of France?",
        kb_name="test",
        mode="hybrid"
    )
    print("\n=== RAG SEARCH RESULT ===")
    print(f"Query: {result.get('query')}")
    print(f"\nAnswer:\n{result.get('answer')}\n")
    print(f"Provider: {result.get('provider')}")
    print(f"Mode: {result.get('mode')}")

asyncio.run(test())
