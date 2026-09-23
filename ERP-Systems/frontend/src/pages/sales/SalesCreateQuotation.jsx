import {
  ArrowLeft,
  FileText,
  Sparkles,
  Calculator,
  ShieldCheck,
} from "lucide-react";

import SalesWorkspace from "./components/SalesWorkspace";

export default function SalesCreateQuotation({
  onNavigate,
  activeView = "sales-create-quotation",
}) {
  return (
    <SalesWorkspace
      activeView="sales-quotations"
      onNavigate={onNavigate}
    >
      <section className="sv3-page">
        {/* =========================
            Header
        ========================= */}

        <header className="sv3-head">
          <div>
            <span>COMMERCIAL WORKSPACE</span>

            <h1>Create Quotation</h1>

            <p>
              Build the commercial offer using MASA ERP's
              existing pricing engine without duplicating
              pricing logic.
            </p>
          </div>

          <button
            type="button"
            className="sv3-primary"
            onClick={() =>
              onNavigate?.("sales-quotations")
            }
          >
            <ArrowLeft size={15} />
            Back to Quotations
          </button>
        </header>

        {/* =========================
            Main Intro
        ========================= */}

        <section
          className="sv3-panel"
          style={{
            marginBottom: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) 220px",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#6557f5",
                  fontSize: 10,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} />

                MASA PRICING ENGINE
              </span>

              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: 22,
                }}
              >
                Advanced Pricing Builder
              </h2>

              <p
                style={{
                  margin: 0,
                  maxWidth: 720,
                  color: "#737b8d",
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                The existing Pricing Builder remains the
                primary source for quotation costing,
                packages, supplier prices, margins and
                commercial approvals.
              </p>
            </div>

            <button
              type="button"
              className="sv3-primary"
              style={{
                height: 46,
                justifyContent: "center",
              }}
              onClick={() =>
                onNavigate?.("pricing-builder")
              }
            >
              <Calculator size={17} />

              Open Pricing Builder
            </button>
          </div>
        </section>

        {/* =========================
            Workflow
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <section className="sv3-panel">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "#f0eeff",
                color: "#6557f5",
                marginBottom: 14,
              }}
            >
              <Calculator size={19} />
            </div>

            <span
              style={{
                fontSize: 9,
                color: "#8f96a5",
                fontWeight: 800,
              }}
            >
              STEP 01
            </span>

            <h3
              style={{
                margin: "5px 0",
                fontSize: 14,
              }}
            >
              Cost & Pricing
            </h3>

            <p
              style={{
                fontSize: 10,
                color: "#848b9a",
                lineHeight: 1.6,
              }}
            >
              Define project cost, products, supplier
              pricing, packages and target margin.
            </p>
          </section>

          <section className="sv3-panel">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "#edf2ff",
                color: "#4f7df3",
                marginBottom: 14,
              }}
            >
              <ShieldCheck size={19} />
            </div>

            <span
              style={{
                fontSize: 9,
                color: "#8f96a5",
                fontWeight: 800,
              }}
            >
              STEP 02
            </span>

            <h3
              style={{
                margin: "5px 0",
                fontSize: 14,
              }}
            >
              Commercial Approval
            </h3>

            <p
              style={{
                fontSize: 10,
                color: "#848b9a",
                lineHeight: 1.6,
              }}
            >
              Validate margin and commercial terms before
              submitting the quotation to the customer.
            </p>
          </section>

          <section className="sv3-panel">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "#eaf9f3",
                color: "#1aa574",
                marginBottom: 14,
              }}
            >
              <FileText size={19} />
            </div>

            <span
              style={{
                fontSize: 9,
                color: "#8f96a5",
                fontWeight: 800,
              }}
            >
              STEP 03
            </span>

            <h3
              style={{
                margin: "5px 0",
                fontSize: 14,
              }}
            >
              Issue Quotation
            </h3>

            <p
              style={{
                fontSize: 10,
                color: "#848b9a",
                lineHeight: 1.6,
              }}
            >
              Generate the approved quotation and continue
              through negotiation and order conversion.
            </p>
          </section>
        </div>
      </section>
    </SalesWorkspace>
  );
}