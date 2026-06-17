"""
Basic setup tests to verify property-based testing framework
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from tests.property_tests.generators import semantic_unit, intent_graph, contradiction

class TestPropertyTestingSetup:
    """Test that property-based testing framework is properly configured"""
    
    @given(st.integers(min_value=1, max_value=100))
    def test_hypothesis_basic_functionality(self, x):
        """Verify Hypothesis is working with basic integer generation"""
        assert isinstance(x, int)
        assert 1 <= x <= 100
    
    @given(semantic_unit())
    @settings(suppress_health_check=[HealthCheck.large_base_example, HealthCheck.too_slow])
    def test_semantic_unit_generation(self, unit):
        """Verify semantic unit generator produces valid structures"""
        assert "id" in unit
        assert "semanticHash" in unit
        assert "content" in unit
        assert "semanticVector" in unit
        assert "intentSignature" in unit
        assert "sourceReferences" in unit
        assert "processingMetadata" in unit
        assert "qualityMetrics" in unit
        
        # Verify semantic vector is list of floats
        assert isinstance(unit["semanticVector"], list)
        assert all(isinstance(x, float) for x in unit["semanticVector"])
        
        # Verify intent signature is valid
        valid_intents = ["informational", "procedural", "analytical", "comparative", "causal"]
        assert unit["intentSignature"] in valid_intents
    
    @given(intent_graph())
    def test_intent_graph_generation(self, graph):
        """Verify intent graph generator produces valid structures"""
        assert "nodes" in graph
        assert "edges" in graph
        assert "rootIntent" in graph
        assert "confidenceScore" in graph
        
        # Verify nodes structure
        assert isinstance(graph["nodes"], list)
        assert len(graph["nodes"]) >= 1
        
        for node in graph["nodes"]:
            assert "id" in node
            assert "intentType" in node
            assert "semanticWeight" in node
            assert "relationshipStrength" in node
            assert "contextualRelevance" in node
    
    @given(contradiction())
    @settings(suppress_health_check=[HealthCheck.large_base_example, HealthCheck.too_slow])
    def test_contradiction_generation(self, contradiction_obj):
        """Verify contradiction generator produces valid structures"""
        assert "id" in contradiction_obj
        assert "conflictingUnits" in contradiction_obj
        assert "contradictionType" in contradiction_obj
        assert "severity" in contradiction_obj
        assert "resolutionStrategy" in contradiction_obj
        
        # Verify conflicting units
        assert isinstance(contradiction_obj["conflictingUnits"], list)
        assert len(contradiction_obj["conflictingUnits"]) >= 2
        
        # Verify contradiction type is valid
        valid_types = ["semantic_conflict", "intent_mismatch", "factual_inconsistency", "temporal_contradiction"]
        assert contradiction_obj["contradictionType"] in valid_types
        
        # Verify resolution strategy is valid
        valid_strategies = ["micro_convergence", "oscillatory_reasoning", "expert_review", "source_priority"]
        assert contradiction_obj["resolutionStrategy"] in valid_strategies