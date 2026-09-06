"use client";

import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  GitCompareArrows,
  Heart,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  SearchCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import type { GurmanHowItWorksCopy, GurmanHowItWorksStage } from "../../apps/web/app/lib/landing-copy";
import { Button } from "./button";

const STAGE_ICONS: Record<GurmanHowItWorksStage["id"], LucideIcon> = {
  intent: Target,
  constraints: SlidersHorizontal,
  evidence: SearchCheck,
  decision: GitCompareArrows,
  language: MessageSquareText,
};

function StatusMark({ tone }: { tone: "supported" | "unknown" | "suppressed" | "ranked" | "alternative" }) {
  if (tone === "supported" || tone === "ranked") {
    return <CircleCheck aria-hidden="true" className="gurman-carousel__status-icon gurman-carousel__status-icon--good" />;
  }
  if (tone === "suppressed") {
    return <X aria-hidden="true" className="gurman-carousel__status-icon gurman-carousel__status-icon--suppressed" />;
  }
  if (tone === "alternative") {
    return <CircleDashed aria-hidden="true" className="gurman-carousel__status-icon gurman-carousel__status-icon--alternative" />;
  }
  return <CircleAlert aria-hidden="true" className="gurman-carousel__status-icon gurman-carousel__status-icon--unknown" />;
}

function IntentVisual({
  stage,
  request,
}: {
  stage: Extract<GurmanHowItWorksStage, { kind: "intent" }>;
  request: string;
}) {
  return (
    <div className="gurman-carousel__visual gurman-carousel__visual--intent">
      <div className="gurman-carousel__visual-label">{stage.visualLabel}</div>
      <div className="gurman-carousel__prompt">
        <Sparkles aria-hidden="true" className="gurman-carousel__prompt-icon" />
        <p>{request}</p>
      </div>
      <div className="gurman-carousel__field-grid">
        {stage.fields.map((field) => (
          <div className="gurman-carousel__field" key={field.label}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConstraintsVisual({ stage }: { stage: Extract<GurmanHowItWorksStage, { kind: "constraints" }> }) {
  return (
    <div className="gurman-carousel__visual gurman-carousel__visual--constraints">
      {stage.groups.map((group) => (
        <div className="gurman-carousel__constraint-group" key={group.label}>
          <div className="gurman-carousel__visual-label">{group.label}</div>
          <div className="gurman-carousel__constraint-list">
            {group.items.map((item) => (
              <div className="gurman-carousel__constraint-item" key={item}>
                {group.tone === "must" ? (
                  <Check aria-hidden="true" className="gurman-carousel__constraint-mark gurman-carousel__constraint-mark--must" />
                ) : (
                  <Heart aria-hidden="true" className="gurman-carousel__constraint-mark gurman-carousel__constraint-mark--prefer" />
                )}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceVisual({ stage }: { stage: Extract<GurmanHowItWorksStage, { kind: "evidence" }> }) {
  return (
    <div className="gurman-carousel__visual gurman-carousel__visual--evidence">
      <div className="gurman-carousel__visual-label">{stage.visualLabel}</div>
      <div className="gurman-carousel__evidence-list">
        {stage.items.map((item) => (
          <div className="gurman-carousel__evidence-row" key={item.label}>
            <span className="gurman-carousel__evidence-label">{item.label}</span>
            <span className={`gurman-carousel__evidence-state gurman-carousel__evidence-state--${item.tone}`}>
              <StatusMark tone={item.tone} />
              {item.status}
            </span>
          </div>
        ))}
      </div>
      <div className="gurman-carousel__evidence-note">
        <BadgeCheck aria-hidden="true" />
        <span>{stage.note}</span>
      </div>
    </div>
  );
}

function DecisionVisual({ stage }: { stage: Extract<GurmanHowItWorksStage, { kind: "decision" }> }) {
  return (
    <div className="gurman-carousel__visual gurman-carousel__visual--decision">
      <div className="gurman-carousel__visual-label">{stage.visualLabel}</div>
      <div className="gurman-carousel__candidate-list">
        {stage.candidates.map((candidate) => (
          <div className={`gurman-carousel__candidate gurman-carousel__candidate--${candidate.tone}`} key={candidate.label}>
            <span className="gurman-carousel__candidate-label">{candidate.label}</span>
            <span className="gurman-carousel__candidate-status">
              <StatusMark tone={candidate.tone} />
              {candidate.status}
            </span>
          </div>
        ))}
      </div>
      <div className="gurman-carousel__decision-state">
        <span>{stage.decisionLabel}</span>
        <strong>{stage.decisionStatus}</strong>
      </div>
    </div>
  );
}

function LanguageVisual({ stage }: { stage: Extract<GurmanHowItWorksStage, { kind: "language" }> }) {
  return (
    <div className="gurman-carousel__visual gurman-carousel__visual--language">
      <div className="gurman-carousel__visual-label">{stage.visualLabel}</div>
      <div className="gurman-carousel__pipeline">
        {stage.pipeline.map((item, index) => (
          <React.Fragment key={item}>
            <span className={`gurman-carousel__pipeline-item${index === 0 ? " gurman-carousel__pipeline-item--first" : ""}`}>
              {index === 0 ? <Layers3 aria-hidden="true" /> : index === stage.pipeline.length - 1 ? <MessageSquareText aria-hidden="true" /> : <span>{String(index).padStart(2, "0")}</span>}
              {item}
            </span>
            {index < stage.pipeline.length - 1 ? <ArrowRight aria-hidden="true" className="gurman-carousel__pipeline-arrow" /> : null}
          </React.Fragment>
        ))}
      </div>
      <div className="gurman-carousel__language-rule">
        <LockKeyhole aria-hidden="true" />
        <strong>{stage.ruleLine}</strong>
      </div>
    </div>
  );
}

function StageVisual({
  stage,
  request,
}: {
  stage: GurmanHowItWorksStage;
  request: string;
}) {
  switch (stage.kind) {
    case "intent":
      return <IntentVisual request={request} stage={stage} />;
    case "constraints":
      return <ConstraintsVisual stage={stage} />;
    case "evidence":
      return <EvidenceVisual stage={stage} />;
    case "decision":
      return <DecisionVisual stage={stage} />;
    case "language":
      return <LanguageVisual stage={stage} />;
  }
}

export default function VCarousel8({ copy }: { copy: GurmanHowItWorksCopy }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [current, setCurrent] = React.useState(0);
  const stages = copy.stages;
  const isLast = current === stages.length - 1;

  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="gurman-carousel" aria-label={copy.carouselLabel}>
      <div className="gurman-carousel__topline">
        <span>{copy.carouselLabel}</span>
        <span>
          {copy.stepLabel} {current + 1} {copy.ofLabel} {stages.length}
        </span>
      </div>
      <div className="gurman-carousel__progress" aria-hidden="true">
        <span style={{ width: `${((current + 1) / stages.length) * 100}%` }} />
      </div>

      <div className="gurman-carousel__viewport" ref={emblaRef}>
        <div className="gurman-carousel__container">
          {stages.map((stage) => {
            const StageIcon = STAGE_ICONS[stage.id];

            return (
              <article className="gurman-carousel__slide" key={stage.id} aria-label={`${stage.number} ${stage.label}`}>
                <div className="gurman-carousel__stage-heading">
                  <div className="gurman-carousel__stage-icon">
                    <StageIcon aria-hidden="true" />
                  </div>
                  <div>
                    <div className="gurman-carousel__stage-meta">
                      <span>{stage.number}</span>
                      <span>{stage.label}</span>
                    </div>
                    <h3>{stage.title}</h3>
                    <p>{stage.description}</p>
                  </div>
                </div>
                <StageVisual request={copy.request} stage={stage} />
              </article>
            );
          })}
        </div>
      </div>

      <div className="gurman-carousel__controls">
        <Button
          aria-label={copy.previousLabel}
          className="gurman-carousel__control"
          disabled={current === 0}
          onClick={() => emblaApi?.scrollPrev()}
          size="icon"
          type="button"
          variant="outline"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="gurman-carousel__dots" role="tablist" aria-label={copy.stageNavigationLabel}>
          {stages.map((stage, index) => (
            <button
              aria-label={`${stage.number} ${stage.label}`}
              aria-selected={current === index}
              className={`gurman-carousel__dot${current === index ? " gurman-carousel__dot--active" : ""}`}
              key={stage.id}
              onClick={() => emblaApi?.scrollTo(index)}
              role="tab"
              type="button"
            />
          ))}
        </div>
        <Button
          aria-label={isLast ? copy.finishLabel : copy.nextLabel}
          className="gurman-carousel__control gurman-carousel__control--next"
          onClick={() => !isLast && emblaApi?.scrollNext()}
          size="icon"
          type="button"
          variant="default"
        >
          {isLast ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
