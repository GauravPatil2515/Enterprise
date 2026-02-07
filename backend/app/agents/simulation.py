from typing import List, Dict, Any
from .constraints import ConstraintAgent
from ..core.models import AnalysisResult, AgentOpinion, DecisionComparison
from ..core.constants import INTERVENTION_IMPACTS

class SimulationAgent:
    """
    The 'What-If' Engine.
    Generates potential interventions and simulates their outcome.
    """
    def __init__(self):
        self.constraint_agent = ConstraintAgent()

    def simulate_interventions(self, risk_score: float, context: Dict[str, Any]) -> List[str]:
        """
        Returns a ranked list of recommended actions.
        """
        possible_actions = [
            "ADD_ENGINEER", 
            "ESCALATE_DEPENDENCY", 
            "REDUCE_SCOPE", 
            "ACCEPT_DELAY"
        ]
        
        recommendations = []
        
        for action in possible_actions:
            # 1. Feasibility Check
            constraint_result = self.constraint_agent.evaluate_intervention(action, context)
            
            if not constraint_result["feasible"]:
                continue
                
            # 2. Impact Simulation (Using named constants)
            impact = INTERVENTION_IMPACTS.get(action, {})
            risk_reduction = impact.get("risk_reduction", 0.0)
            base_penalty = impact.get("cost_penalty", 0.0)
            
            # Context-specific adjustments
            if action == "ESCALATE_DEPENDENCY" and context.get("is_blocked"):
                risk_reduction = 0.4  # Big win if blocked
            
            net_benefit = risk_reduction - (base_penalty + constraint_result["penalty"])
            
            if net_benefit > 0.1:
                # Format specific messages
                msg = action.replace("_", " ").title()
                if "reason" in constraint_result and constraint_result["penalty"] > 0:
                     msg += f" (Note: {constraint_result['reason']})"
                
                recommendations.append((net_benefit, msg))
        
        # Sort by Net Benefit desc
        recommendations.sort(key=lambda x: x[0], reverse=True)
        
        return [r[1] for r in recommendations]
    
    def generate_decision_comparison(self, risk_score: float, context: Dict[str, Any]) -> tuple[List[DecisionComparison], AgentOpinion]:
        """
        Returns structured comparison of all possible actions + agent opinion.
        """
        possible_actions = [
            "ADD_ENGINEER", 
            "ESCALATE_DEPENDENCY", 
            "REDUCE_SCOPE", 
            "ACCEPT_DELAY"
        ]
        
        comparisons = []
        evidence = []
        
        for action in possible_actions:
            # Get constraint evaluation
            constraint_result = self.constraint_agent.evaluate_intervention(action, context)
            
            # Get impact from constants
            impact = INTERVENTION_IMPACTS.get(action, {})
            risk_reduction = impact.get("risk_reduction", 0.0)
            base_penalty = impact.get("cost_penalty", 0.0)
            
            # Context-specific adjustments
            if action == "ESCALATE_DEPENDENCY" and context.get("is_blocked"):
                risk_reduction = 0.4
            
            total_penalty = base_penalty + constraint_result["penalty"]
            net_benefit = risk_reduction - total_penalty
            
            # Determine cost level
            if total_penalty < 0.15:
                cost = "Low"
            elif total_penalty < 0.3:
                cost = "Medium"
            else:
                cost = "High"
            
            # Determine if recommended
            recommended = constraint_result["feasible"] and net_benefit > 0.1
            
            # Build reason
            if not constraint_result["feasible"]:
                reason = constraint_result["reason"]
            elif recommended:
                reason = f"Net benefit: {net_benefit:.2f} (Risk reduction: {risk_reduction:.2f}, Cost: {total_penalty:.2f})"
            else:
                reason = f"Low net benefit ({net_benefit:.2f}) - better options available"
            
            comparisons.append(DecisionComparison(
                action=action.replace("_", " ").title(),
                risk_reduction=risk_reduction,
                cost=cost,
                feasible=constraint_result["feasible"],
                recommended=recommended,
                reason=reason
            ))
            
            if recommended:
                evidence.append(f"{action.replace('_', ' ').title()}: {risk_reduction:.0%} risk reduction")
        
        # Sort by recommendation priority
        comparisons.sort(key=lambda x: (x.recommended, x.risk_reduction), reverse=True)
        
        # Generate agent opinion
        recommended_count = sum(1 for c in comparisons if c.recommended)
        
        if recommended_count == 0:
            claim = "No viable interventions given current constraints"
            confidence = 0.8
        elif recommended_count == 1:
            best = next(c for c in comparisons if c.recommended)
            claim = f"Best option: {best.action}"
            confidence = 0.85
        else:
            best = comparisons[0]
            claim = f"Recommended: {best.action} (highest net benefit)"
            confidence = 0.75
        
        opinion = AgentOpinion(
            agent="SimulationAgent",
            claim=claim,
            confidence=confidence,
            evidence=evidence if evidence else ["All interventions blocked by constraints"]
        )
        
        return comparisons, opinion
