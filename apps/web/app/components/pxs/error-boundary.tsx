"use client";

import type { Locale } from "@manzil/shared";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { getPxsCopy } from "../../lib/pxs/copy";
import { ErrorState } from "./state-panel";

type Props = {
  children: ReactNode;
  locale: Locale;
  /**
   * Custom fallback. Receives `retry`, which resets the boundary and
   * re-renders the subtree — a genuine retry, not a page reload.
   */
  fallback?: (context: { error: Error; retry: () => void }) => ReactNode;
  /** Overrides the default localized heading. */
  title?: string;
  /** Overrides the default localized explanation. */
  body?: string;
  /**
   * Reported here rather than swallowed. Wire this to Sentry at the call site
   * where the surrounding context is known; the boundary itself deliberately
   * does not import a reporter, so it stays usable in any tree.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

/**
 * Error boundary with a real retry.
 *
 * Why this exists next to Next.js's own `error.tsx`: route-level error files
 * take out the whole page. Most failures are local — one widget's fetch, one
 * chart, one third-party embed — and blanking the entire route for them costs
 * the user everything else that was working. This boundary confines the
 * failure to the component that produced it and leaves the rest of the page
 * usable.
 *
 * `retry` clears the captured error and re-renders the children. That is a
 * true retry for the common case (a transient fetch failure inside a client
 * component). For a failure that is deterministic in the render itself, the
 * boundary simply catches again — which is correct, and visibly different from
 * a retry button that silently does nothing.
 *
 * The error message is shown only outside production. In production the user
 * gets a localized sentence they can act on; a stack trace is not that, and
 * error text can carry internal identifiers.
 */
export class PxsErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, locale, fallback, title, body } = this.props;

    if (!error) {
      return children;
    }

    if (fallback) {
      return fallback({ error, retry: this.retry });
    }

    const copy = getPxsCopy(locale);

    return (
      <ErrorState
        actions={
          <button className="pxs-btn pxs-btn--solid" onClick={this.retry} type="button">
            {copy.error.retry}
          </button>
        }
        body={body ?? copy.error.body}
        title={title ?? copy.error.title}
      >
        {process.env.NODE_ENV !== "production" ? (
          <details className="pxs-state__details">
            <summary>{copy.error.detailsLabel}</summary>
            <pre>{error.message}</pre>
          </details>
        ) : null}
      </ErrorState>
    );
  }
}
