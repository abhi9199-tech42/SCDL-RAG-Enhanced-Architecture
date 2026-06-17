# Unified μ-Resonance Cognitive Mesh (URCM)

A revolutionary artificial reasoning system that replaces discrete token-based processing with continuous frequency-based representations.

## Project Structure

```
urcm/
├── __init__.py                 # Main package initialization
├── core/
│   ├── __init__.py            # Core module initialization
│   ├── data_models.py         # Core data structures
│   └── validation.py          # Data validation functions
tests/
├── __init__.py                # Test package initialization
└── test_data_models.py        # Property-based and unit tests
requirements.txt               # Python dependencies
pytest.ini                     # Pytest configuration
README.md                      # This file
```

## Core Data Models

- **PhonemeSequence**: Represents phoneme sequences derived from input text
- **FrequencyPath**: Continuous frequency paths in K-dimensional space (K ∈ [16, 32])
- **ResonanceState**: System resonance states with μ-values and stability scores
- **AttractorState**: Stable semantic attractors with phase patterns
- **ReasoningPath**: Complete reasoning trajectories through the system
- **MeshSignal**: Privacy-preserving signals for decentralized mesh communication

## Testing Framework

The project uses a dual testing approach:
- **Property-based testing** with Hypothesis for universal correctness properties
- **Unit testing** with pytest for specific examples and edge cases

## Installation

```bash
pip install -r requirements.txt
```

## Running Tests

```bash
# Run all tests
python -m pytest

# Run only property-based tests
python -m pytest -m property

# Run only unit tests
python -m pytest -m unit
```

## Key Features

- **Frequency-based representation**: Phoneme-derived continuous vectors instead of discrete tokens
- **μ-convergence reasoning**: Semantic stability through resonance patterns
- **Oscillatory gating**: Brain-inspired periodic activation control
- **Attractor dynamics**: Semantic meanings as stable phase patterns
- **Decentralized mesh**: Privacy-preserving distributed processing
- **Self-correction**: Reconstruction-based error recovery

## Requirements Validation

All data structures include comprehensive validation to ensure:
- Dimensional constraints (K ∈ [16, 32] for frequency vectors)
- Mathematical consistency (μ-values, phase constraints)
- Smoothness properties for frequency paths
- Privacy preservation in mesh signals
- Stability conditions for attractors and reasoning paths