// Debug script to test contradiction detection
const { SCDLSystemImpl } = require('./dist/system/core.js');

async function testContradictionDetection() {
  const system = new SCDLSystemImpl({
    isre: {
      multiLanguage: {
        enabled: true,
        consistencyThreshold: 0.8,
        autoCorrection: true,
        supportedLanguages: ['en', 'es', 'fr']
      },
      compression: {
        optimizationEnabled: true,
        adaptiveCompression: true
      }
    },
    urcm: {
      semanticDetection: {
        enabled: true,
        patternMatching: true,
        domainSpecificRules: true
      }
    },
    performance: {
      monitoring: {
        enabled: true,
        intervalMs: 1000
      }
    },
    audit: {
      enabled: true,
      explainability: {
        enabled: true,
        autoGeneration: true
      }
    }
  });

  await system.initialize();

  const contradictoryContent1 = {
    id: 'contradiction-1',
    content: 'The sky is blue and clear.',
    contentType: 'text'
  };

  const contradictoryContent2 = {
    id: 'contradiction-2',
    content: 'The sky is dark and cloudy.',
    contentType: 'text'
  };

  console.log('Processing content 1...');
  const result1 = await system.processWithOptimization(contradictoryContent1);
  console.log('Result 1:', {
    id: result1.semantics.id,
    vector: result1.semantics.semanticVector.slice(0, 5), // First 5 elements
    intentNodes: result1.semantics.intentNodes
  });

  console.log('Processing content 2...');
  const result2 = await system.processWithOptimization(contradictoryContent2);
  console.log('Result 2:', {
    id: result2.semantics.id,
    vector: result2.semantics.semanticVector.slice(0, 5), // First 5 elements
    intentNodes: result2.semantics.intentNodes
  });

  // Create semantic units for contradiction detection
  const unit1 = {
    id: result1.semantics.id,
    content: contradictoryContent1.content,
    semantics: result1.semantics,
    sourceReferences: result1.semantics.sourceReferences,
    metadata: {}
  };

  const unit2 = {
    id: result2.semantics.id,
    content: contradictoryContent2.content,
    semantics: result2.semantics,
    sourceReferences: result2.semantics.sourceReferences,
    metadata: {}
  };

  console.log('Detecting contradictions...');
  const contradictions = await system.contradictionDetector.detectSemanticContradictions([unit1, unit2]);
  
  console.log('Contradictions found:', contradictions.length);
  if (contradictions.length > 0) {
    console.log('First contradiction:', contradictions[0]);
  }

  await system.shutdown();
}

testContradictionDetection().catch(console.error);