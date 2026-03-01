# -*- coding: utf-8 -*-
"""
RAG Service
===========

Unified RAG service providing a single entry point for all RAG operations.
"""

import json
import os
from pathlib import Path
import shutil
from typing import Any, Dict, List, Optional

from src.logging import get_logger

from .factory import get_pipeline, has_pipeline, list_pipelines

# Default knowledge base directory
DEFAULT_KB_BASE_DIR = str(
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge_bases"
)


class RAGService:
    """
    Unified RAG service entry point.

    Provides a clean interface for RAG operations:
    - Knowledge base initialization
    - Search/retrieval
    - Knowledge base deletion

    Usage:
        # Default configuration
        service = RAGService()
        await service.initialize("my_kb", ["doc1.pdf"])
        result = await service.search("query", "my_kb")

        # Custom configuration for testing
        service = RAGService(kb_base_dir="/tmp/test_kb", provider="llamaindex")
        await service.initialize("test", ["test.txt"])
    """

    def __init__(
        self,
        kb_base_dir: Optional[str] = None,
        provider: Optional[str] = None,
    ):
        """
        Initialize RAG service.

        Args:
            kb_base_dir: Base directory for knowledge bases.
                         Defaults to data/knowledge_bases.
            provider: RAG pipeline provider to use.
                      Defaults to RAG_PROVIDER env var or "raganything".
        """
        self.logger = get_logger("RAGService")
        self.kb_base_dir = kb_base_dir or DEFAULT_KB_BASE_DIR
        self.provider = provider or os.getenv("RAG_PROVIDER", "raganything")
        self._pipeline = None

    def _get_pipeline(self):
        """Get or create pipeline instance."""
        if self._pipeline is None:
            self._pipeline = get_pipeline(self.provider, kb_base_dir=self.kb_base_dir)
        return self._pipeline

    async def initialize(self, kb_name: str, file_paths: List[str], **kwargs) -> bool:
        """
        Initialize a knowledge base with documents.

        Args:
            kb_name: Knowledge base name
            file_paths: List of file paths to process
            **kwargs: Additional arguments passed to pipeline

        Returns:
            True if successful

        Example:
            service = RAGService()
            success = await service.initialize("my_kb", ["doc1.pdf", "doc2.txt"])
        """
        self.logger.info(f"Initializing KB '{kb_name}' with provider '{self.provider}'")
        pipeline = self._get_pipeline()
        return await pipeline.initialize(kb_name=kb_name, file_paths=file_paths, **kwargs)

    async def search(
        self, query: str, kb_name: str, mode: str = "hybrid", **kwargs
    ) -> Dict[str, Any]:
        """
        Search a knowledge base.

        Args:
            query: Search query
            kb_name: Knowledge base name
            mode: Search mode (hybrid, local, global, naive)
            **kwargs: Additional arguments passed to pipeline

        Returns:
            Search results dictionary with keys:
            - query: Original query
            - answer: Generated answer
            - content: Retrieved content
            - mode: Search mode used
            - provider: Pipeline provider used

        Example:
            service = RAGService()
            result = await service.search("What is ML?", "textbook")
            print(result["answer"])
        """
        # Validate KB exists and has indexed data
        kb_dir = Path(self.kb_base_dir) / kb_name
        if not kb_dir.exists():
            raise ValueError(
                f"Knowledge base '{kb_name}' not found. "
                f"Please create it first using the Knowledge page."
            )

        # Check if RAG storage is initialized
        rag_storage_dir = kb_dir / "rag_storage"
        llamaindex_storage_dir = kb_dir / "llamaindex_storage"
        
        # Check if storage directories exist and have content
        rag_has_content = rag_storage_dir.exists() and any(rag_storage_dir.iterdir())
        llamaindex_has_content = llamaindex_storage_dir.exists() and any(llamaindex_storage_dir.iterdir())
        
        if not (rag_has_content or llamaindex_has_content):
            raw_dir = kb_dir / "raw"
            has_docs = raw_dir.exists() and any(raw_dir.iterdir())
            
            error_msg = (
                f"Knowledge base '{kb_name}' exists but has not been indexed yet. "
            )
            if has_docs:
                error_msg += (
                    f"Documents are present in the 'raw' folder, but RAG indexing did not complete. "
                    f"Please refresh the knowledge base using the 'Refresh' button on the Knowledge page "
                    f"to re-index the documents."
                )
            else:
                error_msg += (
                    f"No documents found. Please upload documents to this knowledge base first."
                )
            
            raise ValueError(error_msg)

        # Get the provider from KB metadata, fallback to instance provider
        provider = self._get_provider_for_kb(kb_name)

        self.logger.info(
            f"Searching KB '{kb_name}' with provider '{provider}' and query: {query[:50]}..."
        )

        # Get pipeline for the specific provider
        pipeline = get_pipeline(provider, kb_base_dir=self.kb_base_dir)

        result = await pipeline.search(query=query, kb_name=kb_name, mode=mode, **kwargs)

        # Ensure consistent return format
        if "query" not in result:
            result["query"] = query
        if "answer" not in result and "content" in result:
            result["answer"] = result["content"]
        if "content" not in result and "answer" in result:
            result["content"] = result["answer"]
        if "provider" not in result:
            result["provider"] = provider
        if "mode" not in result:
            result["mode"] = mode

        return result

    def _get_provider_for_kb(self, kb_name: str) -> str:
        """
        Get the RAG provider for a specific knowledge base from its metadata.
        Falls back to instance provider or env var if not found in metadata.

        Args:
            kb_name: Knowledge base name

        Returns:
            Provider name (e.g., 'llamaindex', 'lightrag', 'raganything')
        """
        try:
            metadata_file = Path(self.kb_base_dir) / kb_name / "metadata.json"

            if metadata_file.exists():
                with open(metadata_file, encoding="utf-8") as f:
                    metadata = json.load(f)
                    provider = metadata.get("rag_provider")
                    if provider:
                        self.logger.info(f"Using provider '{provider}' from KB metadata")
                        return provider

            # Fallback based on directory structure (robustness check)
            # This aligns with DocumentAdder logic to support KBs created without metadata
            kb_dir = Path(self.kb_base_dir) / kb_name
            llamaindex_storage = kb_dir / "llamaindex_storage"
            rag_storage = kb_dir / "rag_storage"
            
            # Check which storage actually has data (not just exists)
            if llamaindex_storage.exists() and any(llamaindex_storage.iterdir()):
                self.logger.info(f"Detected LlamaIndex storage with data for '{kb_name}', using provider: llamaindex")
                return "llamaindex"
            
            if rag_storage.exists() and any(rag_storage.iterdir()):
                self.logger.info(f"Detected RAG storage with data for '{kb_name}', using default provider: {self.provider}")
                return self.provider

            # Fallback to instance provider
            self.logger.info(f"No provider in metadata or storage with data, using instance provider: {self.provider}")
            return self.provider

        except Exception as e:
            self.logger.warning(
                f"Error reading provider from metadata: {e}, using instance provider"
            )
            return self.provider

    async def delete(self, kb_name: str) -> bool:
        """
        Delete a knowledge base.

        Args:
            kb_name: Knowledge base name

        Returns:
            True if successful

        Example:
            service = RAGService()
            success = await service.delete("old_kb")
        """
        self.logger.info(f"Deleting KB '{kb_name}'")
        pipeline = self._get_pipeline()

        if hasattr(pipeline, "delete"):
            return await pipeline.delete(kb_name=kb_name)

        # Fallback: delete directory manually
        kb_dir = Path(self.kb_base_dir) / kb_name
        if kb_dir.exists():
            shutil.rmtree(kb_dir)
            self.logger.info(f"Deleted KB directory: {kb_dir}")
            return True
        return False

    @staticmethod
    def list_providers() -> List[Dict[str, str]]:
        """
        List available RAG pipeline providers.

        Returns:
            List of provider info dictionaries

        Example:
            providers = RAGService.list_providers()
            for p in providers:
                print(f"{p['id']}: {p['description']}")
        """
        return list_pipelines()

    @staticmethod
    def get_current_provider() -> str:
        """
        Get the currently configured default provider.

        Returns:
            Provider name from RAG_PROVIDER env var or default
        """
        return os.getenv("RAG_PROVIDER", "raganything")

    @staticmethod
    def has_provider(name: str) -> bool:
        """
        Check if a provider is available.

        Args:
            name: Provider name

        Returns:
            True if provider exists
        """
        return has_pipeline(name)
