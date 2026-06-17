"""
Configuration and fixtures for property-based tests
"""

import pytest
from hypothesis import settings, Verbosity

# Configure Hypothesis for comprehensive testing
settings.register_profile("default", max_examples=100, verbosity=Verbosity.normal)
settings.register_profile("ci", max_examples=200, verbosity=Verbosity.verbose)
settings.register_profile("dev", max_examples=50, verbosity=Verbosity.normal)

# Load the appropriate profile
settings.load_profile("default")

@pytest.fixture
def sample_semantic_unit():
    """Fixture providing a sample semantic unit for testing"""
    return {
        "id": "test-unit-001",
        "semanticHash": "hash123",
        "content": "Sample semantic content",
        "semanticVector": [0.1, 0.2, 0.3, 0.4, 0.5],
        "intentSignature": "informational",
        "sourceReferences": [],
        "processingMetadata": {
            "isreVersion": "1.0.0",
            "urcmVersion": "1.0.0",
            "processingTimestamp": "2024-01-01T00:00:00Z",
            "compressionRatio": 0.8,
            "contradictionResolved": False,
            "resolutionHistory": []
        },
        "qualityMetrics": {
            "semanticConsistency": 0.9,
            "intentClarity": 0.85,
            "sourceReliability": 0.95,
            "contradictionRisk": 0.1
        }
    }

@pytest.fixture
def sample_intent_graph():
    """Fixture providing a sample intent graph for testing"""
    return {
        "nodes": [
            {
                "id": "node1",
                "intentType": "informational",
                "semanticWeight": 0.8,
                "relationshipStrength": 0.7,
                "contextualRelevance": 0.9
            }
        ],
        "edges": [],
        "rootIntent": "informational",
        "confidenceScore": 0.85
    }