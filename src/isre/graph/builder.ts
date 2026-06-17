import { IntentGraph, IntentNode, SemanticRelation } from '../../types';
import { SemanticPrimitive, IntentType, EdgeType } from '../types';

export class IntentGraphBuilder {
  /**
   * Transforms SemanticPrimitives into a structured IntentGraph.
   * Implements explicit conflict detection and representation.
   */
  async buildFromPrimitives(primitives: SemanticPrimitive[]): Promise<IntentGraph> {
    const nodes: IntentNode[] = [];
    const edges: SemanticRelation[] = [];

    // 1. Generate Nodes
    for (const prim of primitives) {
      const nodeType = this.inferIntentType(prim);
      const node: IntentNode = {
        id: `node_${prim.id}`,
        label: prim.concept,
        confidence: prim.semanticWeight,
        attributes: {
          type: nodeType,
          semanticPayload: [prim],
          conflictMarkers: []
        }
      };
      nodes.push(node);
    }

    // 2. Establish basic causal/temporal edges (sequential by default)
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        sourceId: nodes[i].id,
        targetId: nodes[i + 1].id,
        relationType: EdgeType.TEMPORAL,
        weight: 1.0
      });
    }

    // 3. Detect and represent conflicts
    this.detectConflicts(nodes);

    return {
      nodes,
      edges,
      rootIntent: nodes.length > 0 ? nodes[0].id : '',
      confidenceScore: this.calculateGraphConfidence(nodes)
    };
  }

  private inferIntentType(primitive: SemanticPrimitive): IntentType {
    const concept = primitive.concept.toLowerCase();
    if (concept.includes("action") || concept.includes("goal")) return IntentType.GOAL;
    if (concept.includes("query") || concept.includes("?")) return IntentType.QUERY;
    if (concept.includes("constraint") || concept.includes("must") || concept.includes("only")) return IntentType.CONSTRAINT;
    if (concept.includes("emotion")) return IntentType.EMOTION;
    return IntentType.CONTEXT;
  }

  private detectConflicts(nodes: IntentNode[]) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        if (this.areConflicting(n1, n2)) {
          const conflictInfo = {
            type: "semantic_opposition",
            partnerId: n2.id,
            description: `Conflict between ${n1.id} and ${n2.id}`
          };
          n1.attributes.conflictMarkers.push(conflictInfo);
          
          n2.attributes.conflictMarkers.push({
            type: "semantic_opposition",
            partnerId: n1.id,
            description: `Conflict between ${n2.id} and ${n1.id}`
          });
        }
      }
    }
  }

  private areConflicting(n1: IntentNode, n2: IntentNode): boolean {
    // Example logic: "fast" vs "slow"
    // We assume payload is available in attributes
    const concepts1 = (n1.attributes.semanticPayload as SemanticPrimitive[]).map(p => p.concept);
    const concepts2 = (n2.attributes.semanticPayload as SemanticPrimitive[]).map(p => p.concept);

    const opposites: Record<string, string> = {
      "attribute_fast": "attribute_slow",
      "action_move_fast": "action_move_slow"
    };

    // Check bidirectional
    for (const c1 of concepts1) {
      if (opposites[c1] && concepts2.includes(opposites[c1])) return true;
    }
    for (const c2 of concepts2) {
      if (opposites[c2] && concepts1.includes(opposites[c2])) return true;
    }

    return false;
  }

  private calculateGraphConfidence(nodes: IntentNode[]): number {
    if (nodes.length === 0) return 0;
    const totalConfidence = nodes.reduce((sum, node) => sum + node.confidence, 0);
    return totalConfidence / nodes.length;
  }
}
