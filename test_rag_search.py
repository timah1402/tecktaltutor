#!/usr/bin/env python3
"""Test RAG search to verify both documents are indexed."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.services.rag.service import RAGService

def main():
    service = RAGService()
    
    # Test 1: Search for info from first document
    print("=" * 60)
    print("Test 1: Searching for info from test_doc.md (Paris capital)")
    print("=" * 60)
    try:
        result = service.search('test', 'What is the capital of France?', top_k=3)
        print(f"✓ Found {len(result.get('results', []))} results")
        for i, r in enumerate(result.get('results', []), 1):
            print(f"\n  Result {i}:")
            print(f"    Text: {r.get('text', '')[:100]}...")
            print(f"    Score: {r.get('score', 0):.4f}")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Search for info from second document
    print("\n" + "=" * 60)
    print("Test 2: Searching for info from test_doc2.md (Eiffel Tower)")
    print("=" * 60)
    try:
        result = service.search('test', 'Where is the Eiffel Tower located?', top_k=3)
        print(f"✓ Found {len(result.get('results', []))} results")
        for i, r in enumerate(result.get('results', []), 1):
            print(f"\n  Result {i}:")
            print(f"    Text: {r.get('text', '')[:100]}...")
            print(f"    Score: {r.get('score', 0):.4f}")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
