// ============================================================
// Mongwewarona Visuals — Auto-drafted contract template
// ============================================================
function mvBuildContractText({ clientName, service, packageName, pricePula, billingCycle, projectGoals }) {
  const today = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
  const cycleLabel = billingCycle === "month" ? "per month, billed monthly" : "as a one-time project fee";
  const goals = Array.isArray(projectGoals) && projectGoals.length
    ? projectGoals.map(g => "  - " + g).join("\n")
    : "  (Not specified)";

  return `SERVICE AGREEMENT

Date: ${today}
Between: Mongwewarona Visuals ("the Agency")
And: ${clientName} ("the Client")

1. SERVICE
The Agency will provide the Client with the following service:
  Service: ${service}
  Package: ${packageName}
  Fee: P${pricePula} ${cycleLabel}

2. SCOPE
The scope of work is defined by the selected package features as shown on the
Mongwewarona Visuals client portal at the time of this request. Any changes to
scope will be agreed in writing between both parties.

3. TIMELINE
Work begins once this agreement is accepted by both the Client and the Agency.
A project timeline and key dates will be confirmed in the Client's project
dashboard within 3 business days of acceptance.

4. PAYMENT
A 50% deposit is required before work commences. Proof of payment is to be sent
on WhatsApp to +267 74 008 137 or email to mongwewaronat07@gmail.com.
The remaining 50% is due once work is completed.

Banking details:

FNB Botswana
Account Holder: Thato Mongwewarona
Account Number: 62914825627
Branch code: 283567

ABSA
Account Holder: Thato Mongwewarona
Account Number: 1215986
Branch code: 003

5. PROJECT GOAL
What is the goal of this project?
${goals}

6. ACCEPTANCE
By signing below, both parties agree to the terms of this service agreement.

Client signature: ____________________________
Date: ____________________________

Mongwewarona Visuals: Thato Mongwewarona, Creative Director
`;
}
