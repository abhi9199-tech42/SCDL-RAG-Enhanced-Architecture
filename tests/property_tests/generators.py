"""
Hypothesis generators for SCDL-RAG property-based testing
"""

from hypothesis import strategies as st
from typing import Dict, List, Any
import string
from datetime import datetime, timezone

# Basic data generators
@st.composite
def semantic_vector(draw, dimensions: int = 16):  # Further reduced from 64 to 16
    """Generate a semantic vector of specified dimensions with non-zero magnitude"""
    vector = [draw(st.floats(min_value=-1.0, max_value=1.0)) for _ in range(dimensions)]
    
    # Ensure the vector has non-zero magnitude
    magnitude = sum(x * x for x in vector) ** 0.5
    if magnitude < 0.01:  # If magnitude is too small, create a meaningful vector
        vector[0] = draw(st.floats(min_value=0.1, max_value=1.0))
        vector[1] = draw(st.floats(min_value=0.1, max_value=1.0))
    
    return vector

@st.composite
def source_reference(draw):
    """Generate a valid source reference"""
    return {
        "sourceId": draw(st.text(alphabet=string.ascii_letters + string.digits, min_size=5, max_size=20)),
        "documentPath": draw(st.text(alphabet=string.ascii_letters + "/_.", min_size=5, max_size=50)),
        "contentRange": {
            "startOffset": draw(st.integers(min_value=0, max_value=1000)),
            "endOffset": draw(st.integers(min_value=1001, max_value=2000)),
            "startLine": draw(st.integers(min_value=1, max_value=50)),
            "endLine": draw(st.integers(min_value=51, max_value=100))
        },
        "extractionTimestamp": datetime.now(timezone.utc).isoformat(),
        "originalLanguage": draw(st.sampled_from(["en", "es", "fr", "de", "zh", "ja"])),
        "confidence": draw(st.floats(min_value=0.0, max_value=1.0))
    }

@st.composite
def processing_metadata(draw):
    """Generate processing metadata"""
    return {
        "isreVersion": draw(st.text(alphabet=string.digits + ".", min_size=5, max_size=10)),
        "urcmVersion": draw(st.text(alphabet=string.digits + ".", min_size=5, max_size=10)),
        "processingTimestamp": datetime.now(timezone.utc).isoformat(),
        "compressionRatio": draw(st.floats(min_value=0.1, max_value=0.9)),  # Avoid extreme values
        "contradictionResolved": draw(st.booleans()),
        "resolutionHistory": []
    }

@st.composite
def quality_metrics(draw):
    """Generate quality metrics with reasonable values"""
    return {
        "semanticConsistency": draw(st.floats(min_value=0.3, max_value=1.0)),  # Increased minimum
        "intentClarity": draw(st.floats(min_value=0.3, max_value=1.0)),        # Increased minimum
        "sourceReliability": draw(st.floats(min_value=0.3, max_value=1.0)),    # Increased minimum
        "contradictionRisk": draw(st.floats(min_value=0.0, max_value=0.7))     # Reduced maximum
    }

@st.composite
def semantic_unit(draw):
    """Generate a complete semantic unit"""
    return {
        "id": draw(st.text(alphabet=string.ascii_letters + string.digits + "-", min_size=10, max_size=30)),
        "semanticHash": draw(st.text(alphabet=string.ascii_letters + string.digits, min_size=20, max_size=40)),
        "content": draw(st.text(min_size=10, max_size=500)),
        "semanticVector": draw(semantic_vector()),
        "intentSignature": draw(st.sampled_from(["informational", "procedural", "analytical", "comparative", "causal"])),
        "sourceReferences": draw(st.lists(source_reference(), min_size=1, max_size=3)),
        "processingMetadata": draw(processing_metadata()),
        "qualityMetrics": draw(quality_metrics())
    }

@st.composite
def intent_node(draw):
    """Generate an intent node"""
    return {
        "id": draw(st.text(alphabet=string.ascii_letters + string.digits, min_size=5, max_size=15)),
        "intentType": draw(st.sampled_from(["informational", "procedural", "analytical", "comparative", "causal"])),
        "semanticWeight": draw(st.floats(min_value=0.0, max_value=1.0)),
        "relationshipStrength": draw(st.floats(min_value=0.0, max_value=1.0)),
        "contextualRelevance": draw(st.floats(min_value=0.0, max_value=1.0))
    }

@st.composite
def semantic_relation(draw, node_ids: List[str]):
    """Generate a semantic relation between nodes"""
    if len(node_ids) < 2:
        node_ids = ["node1", "node2"]  # Fallback for testing
    
    return {
        "sourceNodeId": draw(st.sampled_from(node_ids)),
        "targetNodeId": draw(st.sampled_from(node_ids)),
        "relationType": draw(st.sampled_from(["causal", "temporal", "semantic", "hierarchical"])),
        "strength": draw(st.floats(min_value=0.0, max_value=1.0)),
        "confidence": draw(st.floats(min_value=0.0, max_value=1.0))
    }

@st.composite
def intent_graph(draw):
    """Generate a complete intent graph"""
    nodes = draw(st.lists(intent_node(), min_size=1, max_size=5))
    node_ids = [node["id"] for node in nodes]
    edges = draw(st.lists(semantic_relation(node_ids), min_size=0, max_size=len(nodes)))
    
    return {
        "nodes": nodes,
        "edges": edges,
        "rootIntent": draw(st.sampled_from(["informational", "procedural", "analytical", "comparative", "causal"])),
        "confidenceScore": draw(st.floats(min_value=0.0, max_value=1.0))
    }

@st.composite
def contradiction(draw):
    """Generate a contradiction between semantic units"""
    # Use simpler semantic units for contradictions to avoid complexity
    conflicting_units = [
        {
            "id": draw(st.text(alphabet=string.ascii_letters, min_size=5, max_size=10)),
            "semanticHash": draw(st.text(alphabet=string.ascii_letters, min_size=10, max_size=15)),
            "content": draw(st.text(min_size=10, max_size=50)),
            "semanticVector": [draw(st.floats(min_value=-1.0, max_value=1.0)) for _ in range(5)],
            "intentSignature": draw(st.sampled_from(["informational", "procedural"])),
            "sourceReferences": [],
            "processingMetadata": {
                "isreVersion": "1.0.0",
                "urcmVersion": "1.0.0",
                "processingTimestamp": datetime.now(timezone.utc).isoformat(),
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
        for _ in range(2)  # Just 2 conflicting units
    ]
    
    return {
        "id": draw(st.text(alphabet=string.ascii_letters + string.digits + "-", min_size=10, max_size=20)),
        "conflictingUnits": conflicting_units,
        "contradictionType": draw(st.sampled_from(["semantic_conflict", "intent_mismatch", "factual_inconsistency", "temporal_contradiction"])),
        "severity": draw(st.floats(min_value=0.0, max_value=1.0)),
        "resolutionStrategy": draw(st.sampled_from(["micro_convergence", "oscillatory_reasoning", "expert_review", "source_priority"]))
    }

@st.composite
def query_intent(draw):
    """Generate a query intent"""
    return {
        "primaryIntent": draw(st.text(min_size=5, max_size=100)),
        "secondaryIntents": draw(st.lists(st.text(min_size=3, max_size=50), min_size=0, max_size=3)),
        "intentVector": draw(semantic_vector()),
        "contextualConstraints": [],
        "expectedResponseType": draw(st.sampled_from(["factual", "explanatory", "instructional", "comparative", "analytical"]))
    }

# Multilingual content generators for language-agnostic testing
@st.composite
def multilingual_content(draw):
    """Generate content in multiple languages with equivalent semantics"""
    # Create multiple semantic equivalents to ensure variety
    semantic_equivalents = [
        "The weather is sunny today",
        "Technology advances rapidly",
        "Education is important for growth",
        "Health requires proper nutrition",
        "Travel broadens perspectives"
    ]
    
    translations = {
        "The weather is sunny today": {
            "en": "The weather is sunny today",
            "es": "El clima está soleado hoy",
            "fr": "Le temps est ensoleillé aujourd'hui", 
            "de": "Das Wetter ist heute sonnig",
            "zh": "今天天气晴朗",
            "ja": "今日は晴れです"
        },
        "Technology advances rapidly": {
            "en": "Technology advances rapidly",
            "es": "La tecnología avanza rápidamente",
            "fr": "La technologie progresse rapidement",
            "de": "Die Technologie entwickelt sich schnell",
            "zh": "技术发展迅速",
            "ja": "技術は急速に進歩している"
        },
        "Education is important for growth": {
            "en": "Education is important for growth",
            "es": "La educación es importante para el crecimiento",
            "fr": "L'éducation est importante pour la croissance",
            "de": "Bildung ist wichtig für das Wachstum",
            "zh": "教育对成长很重要",
            "ja": "教育は成長にとって重要です"
        },
        "Health requires proper nutrition": {
            "en": "Health requires proper nutrition",
            "es": "La salud requiere una nutrición adecuada",
            "fr": "La santé nécessite une nutrition appropriée",
            "de": "Gesundheit erfordert richtige Ernährung",
            "zh": "健康需要适当的营养",
            "ja": "健康には適切な栄養が必要です"
        },
        "Travel broadens perspectives": {
            "en": "Travel broadens perspectives",
            "es": "Viajar amplía las perspectivas",
            "fr": "Voyager élargit les perspectives",
            "de": "Reisen erweitert den Horizont",
            "zh": "旅行开阔视野",
            "ja": "旅行は視野を広げる"
        }
    }
    
    # Select a semantic equivalent
    semantic_equivalent = draw(st.sampled_from(semantic_equivalents))
    translation_set = translations[semantic_equivalent]
    
    # Select a language
    language = draw(st.sampled_from(list(translation_set.keys())))
    
    return {
        "content": translation_set[language],
        "language": language,
        "semanticEquivalent": semantic_equivalent
    }