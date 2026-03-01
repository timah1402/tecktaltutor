#!/usr/bin/env python
"""
Quick script to refresh knowledge bases
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from src.services.rag.service import RAGService
from src.logging import get_logger

logger = get_logger("RefreshKB")

async def refresh_kb(kb_name: str):
    """Refresh a knowledge base by re-indexing all documents in raw/"""
    logger.info(f"Refreshing KB: {kb_name}")
    
    kb_base_dir = Path(__file__).parent / "data" / "knowledge_bases"
    kb_dir = kb_base_dir / kb_name
    raw_dir = kb_dir / "raw"
    
    if not raw_dir.exists():
        logger.error(f"Raw directory not found: {raw_dir}")
        return False
    
    # Get all files in raw directory
    files = [str(f) for f in raw_dir.iterdir() if f.is_file()]
    
    if not files:
        logger.error(f"No files found in {raw_dir}")
        return False
    
    logger.info(f"Found {len(files)} file(s) to index")
    
    # Get provider from metadata or use default
    metadata_file = kb_dir / "metadata.json"
    provider = None
    if metadata_file.exists():
        import json
        with open(metadata_file) as f:
            metadata = json.load(f)
            provider = metadata.get("rag_provider")
    
    # Default to llamaindex if not specified
    if not provider:
        provider = "llamaindex"
        logger.info(f"No provider in metadata, using: {provider}")
    
    # Initialize RAG service
    service = RAGService(
        kb_base_dir=str(kb_base_dir),
        provider=provider
    )
    
    try:
        # Process documents
        logger.info(f"Processing documents with provider: {provider}")
        success = await service.initialize(
            kb_name=kb_name,
            file_paths=files,
            extract_numbered_items=False  # Skip for speed
        )
        
        if success:
            logger.info(f"✓ Successfully refreshed KB: {kb_name}")
            
            # Update metadata with provider
            if metadata_file.exists():
                import json
                with open(metadata_file) as f:
                    metadata = json.load(f)
                metadata["rag_provider"] = provider
                with open(metadata_file, "w") as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                logger.info(f"✓ Updated metadata with provider: {provider}")
            
            return True
        else:
            logger.error(f"✗ Failed to refresh KB: {kb_name}")
            return False
            
    except Exception as e:
        logger.error(f"✗ Error refreshing KB: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    if len(sys.argv) < 2:
        print("Usage: python refresh_kb.py <kb_name>")
        print("Example: python refresh_kb.py blockchain")
        sys.exit(1)
    
    kb_name = sys.argv[1]
    success = await refresh_kb(kb_name)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
